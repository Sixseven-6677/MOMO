/**
 * utils/persistence.js
 * حفظ دائم لبيانات اللاعبين والـ appstate عبر GitHub
 * يسحب البيانات عند الإطلاق ويرفعها تلقائياً كل 5 دقائق
 *
 * متغيرات البيئة المطلوبة على Railway:
 *   GITHUB_TOKEN  = توكن GitHub الشخصي (لديه صلاحية repo)
 *   GITHUB_REPO   = اسم الريبو (مثال: Sixseven-6677/MOMO)
 */

const axios = require('axios');
const fs    = require('fs');
const path  = require('path');

const TOKEN    = process.env.GITHUB_TOKEN  || '';
const REPO     = process.env.GITHUB_REPO   || 'Sixseven-6677/MOMO';
const DATA_DIR = path.join(process.cwd(), 'Horizon_Database');
const TRACKED  = ['qetal_players.json', 'qetal_guilds.json', 'admins.json'];
const APPSTATE_FILES = ['appstate.json', 'appstate2.json', 'appstate3.json'];

const shaCache = {};

function log(msg) { console.log('[Persistence] ' + msg); }

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ── رفع ملف من Horizon_Database ─────────────────────────────────────────
async function pushFile(fileName) {
  if (!TOKEN) return false;
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) return false;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const b64     = Buffer.from(content).toString('base64');
    const body    = { message: `data: backup ${fileName}`, content: b64 };
    if (shaCache[fileName]) body.sha = shaCache[fileName];

    const { data } = await axios.put(
      `https://api.github.com/repos/${REPO}/contents/Horizon_Database/${fileName}`,
      body,
      { headers: { Authorization: `token ${TOKEN}`, 'User-Agent': 'MOMO-Bot' }, timeout: 12000 }
    );
    if (data.content && data.content.sha) shaCache[fileName] = data.content.sha;
    log(`pushed ${fileName}`);
    return true;
  } catch (e) {
    if (e.response && e.response.status === 409) {
      try {
        const { data: fd } = await axios.get(
          `https://api.github.com/repos/${REPO}/contents/Horizon_Database/${fileName}`,
          { headers: { Authorization: `token ${TOKEN}`, 'User-Agent': 'MOMO-Bot' }, timeout: 8000 }
        );
        shaCache[fileName] = fd.sha;
        return pushFile(fileName);
      } catch {}
    }
    log(`pushFile error ${fileName}: ` + (e.message || e));
    return false;
  }
}

// ── سحب ملف من Horizon_Database ─────────────────────────────────────────
async function pullFile(fileName) {
  if (!TOKEN) return false;
  try {
    const { data } = await axios.get(
      `https://api.github.com/repos/${REPO}/contents/Horizon_Database/${fileName}`,
      { headers: { Authorization: `token ${TOKEN}`, 'User-Agent': 'MOMO-Bot' }, timeout: 8000 }
    );
    shaCache[fileName] = data.sha;
    ensureDir();
    fs.writeFileSync(path.join(DATA_DIR, fileName), Buffer.from(data.content, 'base64').toString('utf8'), 'utf8');
    log(`pulled ${fileName} (${data.size} bytes)`);
    return true;
  } catch (e) {
    if (e.response && e.response.status === 404) return false;
    log(`pullFile error ${fileName}: ` + (e.message || e));
    return false;
  }
}

// ── رفع appstate إلى جذر الريبو ──────────────────────────────────────────
async function pushAppstate(fileName) {
  if (!TOKEN) return false;
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return false;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const b64     = Buffer.from(content).toString('base64');
    const cacheKey = 'root_' + fileName;
    const body    = { message: `data: backup ${fileName}`, content: b64 };
    if (shaCache[cacheKey]) body.sha = shaCache[cacheKey];

    const { data } = await axios.put(
      `https://api.github.com/repos/${REPO}/contents/${encodeURIComponent(fileName)}`,
      body,
      { headers: { Authorization: `token ${TOKEN}`, 'User-Agent': 'MOMO-Bot' }, timeout: 12000 }
    );
    if (data.content && data.content.sha) shaCache[cacheKey] = data.content.sha;
    log(`pushed appstate: ${fileName}`);
    return true;
  } catch (e) {
    if (e.response && e.response.status === 409) {
      try {
        const { data: fd } = await axios.get(
          `https://api.github.com/repos/${REPO}/contents/${encodeURIComponent(fileName)}`,
          { headers: { Authorization: `token ${TOKEN}`, 'User-Agent': 'MOMO-Bot' }, timeout: 8000 }
        );
        shaCache['root_' + fileName] = fd.sha;
        return pushAppstate(fileName);
      } catch {}
    }
    log(`pushAppstate error ${fileName}: ` + (e.message || e));
    return false;
  }
}

// ── سحب appstate من جذر الريبو ───────────────────────────────────────────
async function pullAppstate(fileName) {
  if (!TOKEN) return false;
  try {
    const { data } = await axios.get(
      `https://api.github.com/repos/${REPO}/contents/${encodeURIComponent(fileName)}`,
      { headers: { Authorization: `token ${TOKEN}`, 'User-Agent': 'MOMO-Bot' }, timeout: 8000 }
    );
    shaCache['root_' + fileName] = data.sha;
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    fs.writeFileSync(path.join(process.cwd(), fileName), content, 'utf8');
    log(`pulled appstate: ${fileName} (${data.size} bytes)`);
    return true;
  } catch (e) {
    if (e.response && e.response.status === 404) return false;
    log(`pullAppstate error ${fileName}: ` + (e.message || e));
    return false;
  }
}

// ── رفع appstate بعد تسجيل الدخول مباشرة ────────────────────────────────
async function pushAppstateNow(fileName) {
  fileName = fileName || 'appstate.json';
  log(`saving fresh appstate: ${fileName}`);
  return pushAppstate(fileName);
}

// ── مزامنة من GitHub عند الإطلاق ─────────────────────────────────────────
async function syncFromGitHub() {
  log('syncing data from GitHub...');
  // سحب بيانات اللاعبين
  for (const f of TRACKED) await pullFile(f);
  // سحب ملفات الـ appstate
  for (const f of APPSTATE_FILES) await pullAppstate(f);
  log('sync from GitHub done');
}

// ── رفع جميع البيانات إلى GitHub ─────────────────────────────────────────
async function syncToGitHub() {
  if (!TOKEN) return;
  for (const f of TRACKED) {
    if (fs.existsSync(path.join(DATA_DIR, f))) await pushFile(f);
  }
}

// ── بدء النسخ الاحتياطي التلقائي ─────────────────────────────────────────
function startAutoBackup(intervalMs) {
  const ms = intervalMs || 5 * 60 * 1000;
  if (!TOKEN) {
    log('GITHUB_TOKEN not set — auto-backup disabled. Add it to Railway environment variables.');
    return;
  }
  log(`auto-backup every ${ms / 1000}s`);
  setInterval(async () => {
    try {
      await syncToGitHub();
      // رفع الـ appstate كل 30 دقيقة (6 دورات × 5 دقائق)
      const now = Date.now();
      if (!startAutoBackup._lastAppstatePush || now - startAutoBackup._lastAppstatePush > 30 * 60 * 1000) {
        startAutoBackup._lastAppstatePush = now;
        for (const f of APPSTATE_FILES) await pushAppstate(f);
      }
    } catch (e) { log('auto-backup error: ' + e.message); }
  }, ms);
}

module.exports = { syncFromGitHub, syncToGitHub, startAutoBackup, pullFile, pushFile, pushAppstateNow, pushAppstate, pullAppstate };
