/**
 * index.js — مشغّل البوت الرئيسي
 * لا restart تلقائي — فقط عند تحديث الكوكيز عبر /update-cookies
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
const botInstances = new Map();   // appstateFile → child process
const _restarting  = new Set();   // حماية من double-start
const _lastStart   = new Map();   // anti-spam

const MIN_BETWEEN_STARTS = 20_000; // 20 ثانية بين كل start

function startBot(appstateFile, reason) {
  // منع double-start على نفس الحساب
  if (_restarting.has(appstateFile)) {
    logger(`[${appstateFile}] start already in progress — skipping`, 'BOT');
    return;
  }

  // anti-spam
  const now  = Date.now();
  const last = _lastStart.get(appstateFile) || 0;
  if (now - last < MIN_BETWEEN_STARTS) {
    logger(`[${appstateFile}] start blocked (too soon)`, 'BOT');
    return;
  }
  _lastStart.set(appstateFile, now);
  _restarting.add(appstateFile);

  if (reason) logger(`[${appstateFile}] ${reason}`, 'BOT');

  // أوقف النسخة القديمة أولاً
  const old = botInstances.get(appstateFile);
  if (old) {
    try { old.kill('SIGTERM'); } catch(e) {}
    botInstances.delete(appstateFile);
  }

  // تأخير بسيط لضمان إغلاق النسخة القديمة
  setTimeout(() => {
    _restarting.delete(appstateFile);

    const child = spawn('node', ['--trace-warnings', '--async-stack-traces', 'main.js'], {
      cwd   : __dirname,
      stdio : 'inherit',
      shell : true,
      env   : { ...process.env, APPSTATE_FILE: appstateFile }
    });

    botInstances.set(appstateFile, child);

    // ── لا إعادة تشغيل تلقائية بأي سبب ─────────────────────────────────
    child.on('close', (code) => {
      botInstances.delete(appstateFile);
      logger(`[${appstateFile}] bot stopped (code ${code}) — not restarting automatically`, 'BOT');
    });

    child.on('error', (err) => {
      logger(`[${appstateFile}] error: ${err.message}`, 'BOT');
    });

  }, old ? 3000 : 0);
}

// ── تحديث الكوكيز عبر الويب (المدخل الوحيد لإعادة التشغيل) ─────────────
app.get('/',        (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/cookies', (req, res) => res.sendFile(path.join(__dirname, 'cookies.html')));

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

    writeFileSync(filePath, JSON.stringify(appstate, null, 2), 'utf8');
    writeFileSync(flagPath, '1', 'utf8');
    logger(`${fileName} updated via /update-cookies — restarting account`, 'BOT');

    // أعد تشغيل هذا الحساب فقط
    startBot(fileName, 'restarting due to cookies update');

    res.json({ success: true, message: `تم حفظ كوكيز الحساب ${accountNum} (${appstate.length} كوكي)` });
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

  for (let i = 0; i < appstateFiles.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 3000));
    startBot(appstateFiles[i], 'starting bot...');
  }
})();

process.on('unhandledRejection', (err) => {
  logger('unhandledRejection: ' + (err?.message || err), 'WARN');
});
process.on('uncaughtException', (err) => {
  logger('uncaughtException: ' + err.message, 'WARN');
});

setInterval(() => {}, 1000 * 60 * 10);
