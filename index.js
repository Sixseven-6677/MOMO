/**
 * index.js — مشغّل البوت الرئيسي
 *
 * القواعد:
 *  ✅ يُعيد تشغيل main.js فقط عند: تغيير appstate / config عبر file watcher
 *  ✅ عند انقطاع الاتصال: يُعيد تسجيل الدخول فقط (reconnectManager)
 *  ❌ لا يُعيد التشغيل بسبب: errors / crashes / websocket close / Facebook issues
 *  ❌ لا restart spam / duplicate sessions
 */

const { spawn }    = require('child_process');
const { readFileSync, writeFileSync, existsSync } = require('fs-extra');
const axios        = require('axios');
const logger       = require('./utils/log');
const express      = require('express');
const path         = require('path');
const chalk        = require('chalkercli');
const CFonts       = require('cfonts');

const { rawCookiesToAppstate } = require('./utils/cookieConverter');
const { syncFromGitHub }       = require('./utils/persistence');
const { startWatcher }         = require('./utils/fileWatcher');

const app  = express();
const port = process.env.PORT || 2006;

if (!process.env.BOT_START_TIME) process.env.BOT_START_TIME = Date.now().toString();
app.use(express.json());

// ── حقن الكوكيز من متغيرات البيئة ──────────────────────────────────────
(function () {
  try {
    const flag = path.join(__dirname, 'appstate.manual');
    if (existsSync(flag)) return;
    if (process.env.FB_COOKIES) {
      const appstate = rawCookiesToAppstate(process.env.FB_COOKIES);
      writeFileSync(path.join(__dirname, 'appstate.json'), JSON.stringify(appstate, null, 2), 'utf8');
      logger('appstate.json generated from FB_COOKIES', 'BOT');
    } else if (process.env.APPSTATE_JSON) {
      writeFileSync(path.join(__dirname, 'appstate.json'), process.env.APPSTATE_JSON, 'utf8');
      logger('appstate.json loaded from APPSTATE_JSON', 'BOT');
    }
  } catch (e) {
    logger('Failed to write appstate.json: ' + e.message, 'BOT');
  }
})();

function getAppstateFiles() {
  const files = [];
  if (existsSync(path.join(__dirname, 'appstate.json'))) files.push('appstate.json');
  for (let i = 2; i <= 10; i++) {
    const f = `appstate${i}.json`;
    if (existsSync(path.join(__dirname, f))) files.push(f);
  }
  return files.length > 0 ? files : ['appstate.json'];
}

// ── إدارة عمليات البوت ───────────────────────────────────────────────────
const botInstances  = new Map();  // appstateFile → child process
const _fileChanging = new Set();  // حماية من restart مزدوج
const _restartAt    = new Map();  // anti-spam: آخر وقت restart لكل حساب

const MIN_RESTART_INTERVAL = 15_000; // 15 ثانية حد أدنى بين كل restart

function startBot(appstateFile, reason) {
  // حماية anti-spam
  const now = Date.now();
  const last = _restartAt.get(appstateFile) || 0;
  if (now - last < MIN_RESTART_INTERVAL) {
    logger(`[${appstateFile}] restart blocked (too soon — anti-spam)`, 'RESTART');
    return;
  }
  _restartAt.set(appstateFile, now);

  if (reason) logger(`[${appstateFile}] ${reason}`, 'BOT');

  // أوقف أي نسخة قديمة بهدوء
  const old = botInstances.get(appstateFile);
  if (old) {
    try { old.kill('SIGTERM'); } catch(e) {}
    botInstances.delete(appstateFile);
  }

  const child = spawn('node', ['--trace-warnings', '--async-stack-traces', 'main.js'], {
    cwd    : __dirname,
    stdio  : 'inherit',
    shell  : true,
    env    : { ...process.env, APPSTATE_FILE: appstateFile }
  });

  botInstances.set(appstateFile, child);

  child.on('close', (codeExit) => {
    botInstances.delete(appstateFile);

    // ── خرج نظيفاً (SIGTERM من file watcher) — لا إعادة تشغيل ──────────
    if (codeExit === 0 || codeExit === null) {
      // إذا كان الملف قيد التغيير، سيُعاد التشغيل من file watcher callback
      if (!_fileChanging.has(appstateFile)) {
        logger(`[${appstateFile}] bot exited cleanly — not restarting`, 'RESTART');
      }
      return;
    }

    // ── أي كود آخر: لا إعادة تشغيل تلقائية ────────────────────────────
    // إعادة التشغيل تحدث فقط عبر file watcher أو تحديث الكوكيز
    logger(
      `[${appstateFile}] bot stopped (code ${codeExit}) — not restarting automatically`,
      'RESTART'
    );
    logger(
      `[${appstateFile}] to restart: update appstate.json or config.json`,
      'RESTART'
    );
  });

  child.on('error', (err) => {
    logger(`[${appstateFile}] spawn error: ${err.message}`, 'BOT');
  });
}

// ── تحديث الكوكيز عبر الويب ──────────────────────────────────────────────
app.get('/',          (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/cookies',   (req, res) => res.sendFile(path.join(__dirname, 'cookies.html')));

app.post('/update-cookies', (req, res) => {
  try {
    const { cookies, account } = req.body;
    if (!cookies || typeof cookies !== 'string' || !cookies.trim())
      return res.status(400).json({ success: false, error: 'No cookies provided' });

    const appstate   = rawCookiesToAppstate(cookies.trim());
    const accountNum = parseInt(account) || 1;
    const fileName   = accountNum === 1 ? 'appstate.json' : `appstate${accountNum}.json`;
    const filePath   = path.join(__dirname, fileName);
    const flagPath   = path.join(__dirname, fileName.replace('.json', '.manual'));

    // كتابة الملف ستُطلق file watcher تلقائياً → إعادة تشغيل مضبوطة
    writeFileSync(filePath, JSON.stringify(appstate, null, 2), 'utf8');
    writeFileSync(flagPath, '1', 'utf8');
    logger(`${fileName} updated via /update-cookies`, 'BOT');

    res.json({ success: true, message: `تم حفظ كوكيز الحساب ${accountNum} (${appstate.length} كوكي) — سيُعاد التشغيل تلقائياً` });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

app.get('/accounts', (req, res) => {
  const files   = getAppstateFiles();
  const running = [];
  botInstances.forEach((_, f) => running.push(f));
  res.json({ total: files.length, files, running });
});

app.listen(port);
logger('Server started at port ' + port, 'BOT');

const rainbow = chalk.rainbow('\n                 [=== FANG Multi-Account ===]\n\n').stop();
rainbow.render();
console.log(rainbow.frame());

// ── إطلاق البوت ──────────────────────────────────────────────────────────
(async () => {
  try {
    logger('جاري جلب أحدث البيانات من GitHub...', 'SYNC');
    await syncFromGitHub();
    logger('تم جلب البيانات بنجاح ✓', 'SYNC');
  } catch (e) {
    logger('تحذير: فشل جلب البيانات من GitHub — ' + e.message, 'SYNC');
  }

  const appstateFiles = getAppstateFiles();
  logger(`Found ${appstateFiles.length} account(s): ${appstateFiles.join(', ')}`, 'MULTI-ACCOUNT');

  // ── تشغيل الحسابات بتأخير بسيط بينها ──────────────────────────────────
  for (let i = 0; i < appstateFiles.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 3000));
    startBot(appstateFiles[i], 'starting bot...');
  }

  // ── file watcher: يُعيد التشغيل فقط عند تغيير ملفات الجلسة والإعدادات ─
  startWatcher(
    __dirname,

    // تغيّر appstate → أعد تشغيل الحساب المقابل فقط
    (fileName) => {
      _fileChanging.add(fileName);
      logger(`restarting due to file changes: ${fileName}`, '[ FILE WATCHER ]');
      const child = botInstances.get(fileName);
      if (child) try { child.kill('SIGTERM'); } catch(e) {}

      setTimeout(() => {
        _fileChanging.delete(fileName);
        startBot(fileName, `restarting due to file changes: ${fileName}`);
      }, 2000);
    },

    // تغيّر config.json → أعد تشغيل جميع الحسابات
    (fileName) => {
      logger(`restarting due to file changes: ${fileName}`, '[ FILE WATCHER ]');
      const allFiles = getAppstateFiles();

      botInstances.forEach((child, f) => {
        _fileChanging.add(f);
        try { child.kill('SIGTERM'); } catch(e) {}
      });

      setTimeout(async () => {
        for (let i = 0; i < allFiles.length; i++) {
          if (i > 0) await new Promise(r => setTimeout(r, 3000));
          _fileChanging.delete(allFiles[i]);
          startBot(allFiles[i], `restarting due to file changes: ${fileName}`);
        }
      }, 3000);
    }
  );

})();

// ── منع انهيار العملية الرئيسية بأي خطأ غير متوقع ──────────────────────
process.on('unhandledRejection', (err) => {
  logger('unhandledRejection in index: ' + (err?.message || err), 'WARN');
});
process.on('uncaughtException', (err) => {
  logger('uncaughtException in index: ' + err.message, 'WARN');
});

// keep-alive — يمنع العملية من الخروج بدون سبب
setInterval(() => {}, 1000 * 60 * 10);
