const { spawn }                    = require('child_process');
const { readFileSync, writeFileSync, existsSync } = require('fs-extra');
const axios                        = require('axios');
const logger                       = require('./utils/log');
const express                      = require('express');
const path                         = require('path');
const chalk                        = require('chalkercli');
const CFonts                       = require('cfonts');
const { rawCookiesToAppstate }     = require('./utils/cookieConverter');
const { syncFromGitHub, syncToGitHub, startAutoBackup } = require('./utils/persistence');
const moment                       = require('moment-timezone');

const app  = express();
const port = process.env.PORT || 2006;
app.use(express.json());

var gio = moment.tz('Asia/Ho_Chi_Minh').format('HH:mm:ss || D/MM/YYYY');

// ── جلب أحدث بيانات اللاعبين من GitHub عند الإطلاق ──────────────────────
// syncFromGitHub سيُستدعى داخل setTimeout بعد التأكد من الإعداد

// ── حقن الكوكيز عبر متغيرات البيئة (للحساب الأول فقط) ───────────────────
(function () {
  try {
    const flag = path.join(__dirname, 'appstate.manual');
    if (existsSync(flag)) return; // تجاهل إذا تم التحديث يدوياً
    if (process.env.FB_COOKIES) {
      const appstate = rawCookiesToAppstate(process.env.FB_COOKIES);
      writeFileSync(path.join(__dirname, 'appstate.json'), JSON.stringify(appstate, null, 2), 'utf8');
      console.log('[BOT] appstate.json generated from FB_COOKIES');
    } else if (process.env.APPSTATE_JSON) {
      writeFileSync(path.join(__dirname, 'appstate.json'), process.env.APPSTATE_JSON, 'utf8');
      console.log('[BOT] appstate.json loaded from APPSTATE_JSON');
    }
  } catch (e) {
    console.error('[BOT] Failed to write appstate.json:', e.message);
  }
})();

// ── اكتشاف ملفات الحسابات المتعددة ──────────────────────────────────────
function getAppstateFiles() {
  const files = [];
  if (existsSync(path.join(__dirname, 'appstate.json'))) files.push('appstate.json');
  for (let i = 2; i <= 10; i++) {
    const f = `appstate${i}.json`;
    if (existsSync(path.join(__dirname, f))) files.push(f);
  }
  return files.length > 0 ? files : ['appstate.json'];
}

// ── إدارة العمليات ────────────────────────────────────────────────────────
const botInstances = new Map(); // appstateFile → child process

function startBot(appstateFile, message) {
  if (message) logger(`[${appstateFile}] ${message}`, 'BOT');

  const child = spawn('node', ['--trace-warnings', '--async-stack-traces', 'main.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, APPSTATE_FILE: appstateFile }
  });

  botInstances.set(appstateFile, child);

  child.on('close', async (codeExit) => {
    botInstances.delete(appstateFile);
    const x = String(codeExit);
    const ts = new Date().toLocaleTimeString('ar');
    if (codeExit === 1) {
      logger(`[${appstateFile}] ⚠️ توقف (code 1) الساعة ${ts} — إعادة التشغيل بعد 15 ثانية`, 'RESTART');
      await new Promise(r => setTimeout(r, 15000));
      return startBot(appstateFile, 'RESTARTING...');
    } else if (x.startsWith('2')) {
      const delay = parseInt(x.slice(1)) * 1000 || 3000;
      logger(`[${appstateFile}] إعادة تنشيط (code ${codeExit}) بعد ${delay/1000}s`, 'RESTART');
      await new Promise(r => setTimeout(r, delay));
      startBot(appstateFile, 'Reactivating...');
    } else if (codeExit === 0) {
      logger(`[${appstateFile}] ⚪ خرج نظيفاً (code 0) — لن يُعاد التشغيل`, 'RESTART');
    } else {
      logger(`[${appstateFile}] ❓ كود خروج غير معروف: ${codeExit}`, 'RESTART');
    }
  });

  child.on('error', (error) => {
    logger(`[${appstateFile}] Error: ` + JSON.stringify(error), '[ Starting ]');
  });
}

// ── نقطة نهاية لتحديث الكوكيز عبر الويب ─────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/cookies', (req, res) => res.sendFile(path.join(__dirname, 'cookies.html')));

app.post('/update-cookies', (req, res) => {
  try {
    const { cookies, account } = req.body;
    if (!cookies || typeof cookies !== 'string' || !cookies.trim())
      return res.status(400).json({ success: false, error: 'No cookies provided' });

    const appstate     = rawCookiesToAppstate(cookies.trim());
    const accountNum   = parseInt(account) || 1;
    const fileName     = accountNum === 1 ? 'appstate.json' : `appstate${accountNum}.json`;
    const filePath     = path.join(__dirname, fileName);
    const flagPath     = path.join(__dirname, fileName.replace('.json', '.manual'));

    writeFileSync(filePath, JSON.stringify(appstate, null, 2), 'utf8');
    writeFileSync(flagPath, '1', 'utf8');
    console.log(`[BOT] ${fileName} updated via /update-cookies`);

    const child = botInstances.get(fileName);
    if (child) try { child.kill('SIGTERM'); } catch (e) {}

    res.json({ success: true, message: `تم حفظ كوكيز الحساب ${accountNum} (${appstate.length} كوكي)` });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// ── واجهة لإدارة الحسابات ─────────────────────────────────────────────────
app.get('/accounts', (req, res) => {
  const files = getAppstateFiles();
  const running = [];
  botInstances.forEach((_, f) => running.push(f));
  res.json({ total: files.length, files, running });
});

app.listen(port);
console.log('[BOT] Server started at port ' + port);
logger('Facebook: https://www.facebook.com/TatsuYTB', 'Facebook');

const rainbow = chalk.rainbow('\n                 [=== MOMO Multi-Account ===]\n\n').stop();
rainbow.render();
console.log(rainbow.frame());
logger('Multi-account mode active', 'UPDATE');

// ── بدء النسخ الاحتياطي التلقائي كل 5 دقائق ──────────────────────────────
startAutoBackup(30 * 60 * 1000); // كل 30 دقيقة بدل 5

// ── إطلاق جميع الحسابات ───────────────────────────────────────────────────
(async () => {
  try {
    logger('جاري جلب أحدث البيانات من GitHub...', 'SYNC');
    await syncFromGitHub();
    logger('تم جلب البيانات بنجاح', 'SYNC');
  } catch (e) {
    logger('تحذير: فشل جلب البيانات من GitHub — ' + e.message, 'SYNC');
  }

  rainbow.render();
  console.log(rainbow.frame());
  logger('Loading source code', 'LOAD');

  const appstateFiles = getAppstateFiles();
  logger(`Found ${appstateFiles.length} account(s): ${appstateFiles.join(', ')}`, 'MULTI-ACCOUNT');

  for (let i = 0; i < appstateFiles.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 3000));
    startBot(appstateFiles[i]);
  }
})();
