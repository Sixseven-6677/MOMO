/**
 * utils/persistence.js
 * حفظ دائم لبيانات اللاعبين والـ appstate عبر GitHub
 * يسحب البيانات عند الإطلاق ويرفعها تلقائياً كل 5 دقائق
 *
 * متغيرات البيئة المطلوبة على Railway:
 *   GITHUB_PERSONAL_ACCESS_TOKEN  = توكن GitHub الشخصي (لديه صلاحية repo)
 *   GITHUB_REPO                   = اسم الريبو (اختياري، الافتراضي: Sixseven-6677/MOMO)
 */

const axios = require('axios');
const fs    = require('fs');
const path  = require('path');

// يدعم كلا الاسمين للمتغير
const TOKEN    = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN || '';
const REPO     = process.env.GITHUB_REPO   || 'Sixseven-6677/MOMO';
const DATA_DIR = path.join(process.cwd(), 'Horizon_Database');
const TRACKED  = ['qetal_players.json', 'qetal_guilds.json', 'admins.json'];
const APPSTATE_FILES = ['appstate.json'];

const shaCache = {};

function log(msg) { console.log('[Persistence] ' + msg); }

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ── جلب SHA حالي من GitHub ───────────────────────────────────────────────
async function fetchSha(apiPath) {
  try {
    const { data } = await axios.get(
      `https://api.github.com/repos/${REPO}/contents/${apiPath}`,
      { headers: { Authorization: `token ${TOKEN}`, 'User-Agent': 'MOMO-Bot' }, timeout: 8000 }
    );
    return data.sha || null;
  } catch (e) {
    if (e.response && e.response.status === 404) return null;
    throw e;
  }
}

// ── رفع ملف عام ──────────────────────────────────────────────────────────
async function pushToGitHub(apiPath, localPath, commitMsg) {
  if (!TOKEN) return false;
  if (!fs.existsSync(localPath)) return false;
  try {
    const content  = fs.readFileSync(localPath);
    const b64      = content.toString('base64');
    const cacheKey = apiPath;

    if (!shaCache[cacheKey]) {
      shaCache[cacheKey] = await fetchSha(apiPath);
    }

    const body = { message: commitMsg || `data: backup ${path.basename(localPath)}`, content: b64 };
    if (shaCache[cacheKey]) body.sha = shaCache[cacheKey];

    const { data } = await axios.put(
      `https://api.github.com/repos/${REPO}/contents/${apiPath}`,
      body,
      { headers: { Authorization: `token ${TOKEN}`, 'User-Agent': 'MOMO-Bot' }, timeout: 15000 }
    );
    if (data.content && data.content.sha) shaCache[cacheKey] = data.content.sha;
    log(`pushed → ${apiPath}`);
    return true;
  } catch (e) {
    if (e.response && e.response.status === 409) {
      // conflict — refresh SHA and retry once
      try {
        shaCache[apiPath] = await fetchSha(apiPath);
        return pushToGitHub(apiPath, localPath, commitMsg);
      } catch {}
    }
    log(`push error [${apiPath}]: ` + (e.response ? e.response.status : e.message));
    return false;
  }
}

// ── سحب ملف عام ──────────────────────────────────────────────────────────
async function pullFromGitHub(apiPath, localPath) {
  if (!TOKEN) return false;
  try {
    const { data } = await axios.get(
      `https://api.github.com/repos/${REPO}/contents/${apiPath}`,
      { headers: { Authorization: `token ${TOKEN}`, 'User-Agent': 'MOMO-Bot' }, timeout: 10000 }
    );
    shaCache[apiPath] = data.sha;
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(localPath, Buffer.from(data.content, 'base64'), 'utf8');
    log(`pulled ← ${apiPath} (${data.size} bytes)`);
    return true;
  } catch (e) {
    if (e.response && e.response.status === 404) return false;
    log(`pull error [${apiPath}]: ` + (e.response ? e.response.status : e.message));
    return false;
  }
}

// ── رفع ملف من Horizon_Database ─────────────────────────────────────────
async function pushFile(fileName) {
  const localPath = path.join(DATA_DIR, fileName);
  return pushToGitHub(`Horizon_Database/${fileName}`, localPath, `data: backup ${fileName}`);
}

// ── سحب ملف من Horizon_Database ─────────────────────────────────────────
async function pullFile(fileName) {
  ensureDir();
  const localPath = path.join(DATA_DIR, fileName);
  return pullFromGitHub(`Horizon_Database/${fileName}`, localPath);
}

// ── رفع appstate الـ appstate فوراً بعد تسجيل الدخول ────────────────────
async function pushAppstateNow(fileName) {
  fileName = fileName || 'appstate.json';
  log(`saving fresh appstate after login: ${fileName}`);
  const localPath = path.join(process.cwd(), fileName);
  const result = await pushToGitHub(encodeURIComponent(fileName), localPath, `appstate: auto-save after login`);
  if (result) log('appstate saved to GitHub successfully ✓');
  else log('appstate save skipped (no TOKEN or file not found)');
  return result;
}

// ── سحب appstate من GitHub ───────────────────────────────────────────────
async function pullAppstate(fileName) {
  const localPath = path.join(process.cwd(), fileName);
  return pullFromGitHub(encodeURIComponent(fileName), localPath);
}

// ── رفع appstate ─────────────────────────────────────────────────────────
async function pushAppstate(fileName) {
  const localPath = path.join(process.cwd(), fileName);
  return pushToGitHub(encodeURIComponent(fileName), localPath, `appstate: periodic backup`);
}

// ── مزامنة كاملة من GitHub عند الإطلاق ──────────────────────────────────
async function syncFromGitHub() {
  if (!TOKEN) {
    log('GITHUB_PERSONAL_ACCESS_TOKEN not set — skipping GitHub sync');
    return;
  }
  log('syncing from GitHub on startup...');
  for (const f of TRACKED)        await pullFile(f).catch(() => {});
  for (const f of APPSTATE_FILES) await pullAppstate(f).catch(() => {});
  log('startup sync done ✓');
}

// ── رفع كل البيانات إلى GitHub ───────────────────────────────────────────
async function syncToGitHub() {
  if (!TOKEN) return;
  for (const f of TRACKED) {
    if (fs.existsSync(path.join(DATA_DIR, f))) await pushFile(f).catch(() => {});
  }
}

// ── النسخ الاحتياطي التلقائي الدوري ─────────────────────────────────────
function startAutoBackup(intervalMs) {
  const ms = intervalMs || 5 * 60 * 1000; // كل 5 دقائق
  if (!TOKEN) {
    log('GITHUB_PERSONAL_ACCESS_TOKEN not set — auto-backup disabled');
    log('Add GITHUB_PERSONAL_ACCESS_TOKEN to Railway environment variables to enable it');
    return;
  }
  log(`auto-backup started: every ${ms / 60000} minutes`);

  let cycle = 0;
  setInterval(async () => {
    try {
      cycle++;
      // رفع بيانات اللاعبين كل دورة
      await syncToGitHub();
      // رفع الـ appstate كل 6 دورات (30 دقيقة)
      if (cycle % 6 === 0) {
        for (const f of APPSTATE_FILES) {
          const localPath = path.join(process.cwd(), f);
          if (fs.existsSync(localPath)) await pushAppstate(f).catch(() => {});
        }
        log('periodic appstate backup done');
      }
    } catch (e) {
      log('auto-backup error: ' + e.message);
    }
  }, ms);
}

module.exports = {
  syncFromGitHub,
  syncToGitHub,
  startAutoBackup,
  pullFile,
  pushFile,
  pushAppstateNow,
  pushAppstate,
  pullAppstate
};
