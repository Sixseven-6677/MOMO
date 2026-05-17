/**
 * utils/fileWatcher.js
 * مراقب ذكي للملفات — يُطلق callback فقط عند تغيير ملفات الجلسة والإعدادات
 * لا يُعيد التشغيل بسبب errors أو reconnects أو إغلاق websocket
 */

const fs     = require('fs');
const path   = require('path');
const logger = require('./log');

const TAG          = '[ FILE WATCHER ]';
const DEBOUNCE_MS  = 4000;   // 4 ثوان — تجنّب إعادة التشغيل من حفظ متعدد
const MIN_RESTART  = 30_000; // 30 ثانية — حماية من restart spam

// الملفات التي تستحق إعادة تشغيل عند تغييرها
const SESSION_FILES = [
  'appstate.json', 'appstate2.json', 'appstate3.json',
  'appstate4.json', 'appstate5.json',
  'config.json',
];

// تغيير هذه الملفات يُعيد تحميل الجلسة فقط (ليس restart كامل)
const SESSION_RELOAD_FILES = [
  'appstate.json', 'appstate2.json', 'appstate3.json',
];

const _timers       = {};   // debounce timers per file
const _hashes       = {};   // last known size+mtime per file
const _lastRestart  = {};   // anti-spam: last restart time per file

function _getHash(filePath) {
  try {
    const s = fs.statSync(filePath);
    return `${s.size}|${s.mtimeMs}`;
  } catch { return null; }
}

/**
 * يبدأ مراقبة الملفات
 * @param {string}   rootDir        مجلد المشروع
 * @param {Function} onSessionFile  callback(fileName) عند تغيير appstate
 * @param {Function} onConfigFile   callback(fileName) عند تغيير config
 */
function startWatcher(rootDir, onSessionFile, onConfigFile) {
  for (const fileName of SESSION_FILES) {
    const filePath = path.join(rootDir, fileName);

    // حفظ الحالة الأولية
    _hashes[fileName] = _getHash(filePath);

    // ننشئ الملف إذا لم يكن موجوداً حتى لا يُطلق fs.watch خطأ
    if (!fs.existsSync(filePath)) continue;

    try {
      fs.watch(filePath, { persistent: false }, (eventType) => {
        if (eventType !== 'change') return;

        // debounce — تجاهل الاستدعاءات المتكررة خلال 4 ثوان
        if (_timers[fileName]) clearTimeout(_timers[fileName]);
        _timers[fileName] = setTimeout(() => {
          delete _timers[fileName];

          // تحقق أن الملف تغيّر فعلاً (حجم أو تاريخ)
          const newHash = _getHash(filePath);
          if (!newHash || newHash === _hashes[fileName]) return;
          _hashes[fileName] = newHash;

          // حماية من restart spam
          const now = Date.now();
          if (_lastRestart[fileName] && now - _lastRestart[fileName] < MIN_RESTART) {
            logger(`ignoring rapid change for ${fileName} (anti-spam)`, TAG);
            return;
          }
          _lastRestart[fileName] = now;

          logger(`restarting due to file changes: ${fileName}`, TAG);

          if (SESSION_RELOAD_FILES.includes(fileName)) {
            onSessionFile(fileName, filePath);
          } else {
            onConfigFile(fileName, filePath);
          }
        }, DEBOUNCE_MS);
      });

      logger(`watching: ${fileName}`, TAG);
    } catch(e) {
      logger(`could not watch ${fileName}: ${e.message}`, TAG);
    }
  }
}

/** تحديث hash ملف بعد أن يكتب البوت نفسه فيه (لتجنب trigger غير مقصود) */
function refreshHash(fileName) {
  const filePath = path.join(process.cwd(), fileName);
  _hashes[fileName] = _getHash(filePath);
}

module.exports = { startWatcher, refreshHash };
