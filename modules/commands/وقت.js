const fs   = require('fs');
const path = require('path');

const DATA_FILE    = path.join(process.cwd(), 'modules/commands/data/tawsi3.json');
const MIN_INTERVAL = 1;
const MAX_INTERVAL = 43200;

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) || {};
  } catch(e) { return {}; }
}

function saveData(data) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch(e) {}
}

function formatSeconds(s) {
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return m > 0 ? `${h} ساعة و${m} دقيقة` : `${h} ساعة`;
  }
  if (s >= 60) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return sec > 0 ? `${m} دقيقة و${sec} ثانية` : `${m} دقيقة`;
  }
  return `${s} ثانية`;
}

module.exports.config = {
  name: "وقت",
  version: "3.0.0",
  hasPermssion: 3,
  credits: "FANG",
  description: "يتحكم في وقت الإرسال (بالثواني) للتوسيع",
  commandCategory: "أدوات",
  usages: "وقت ثواني — مثال: وقت 30",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const tid = String(threadID);

  const data    = loadData();
  const current = data[tid] || {};

  if (!args[0]) {
    const status = current.active ? '✅ مفعّل' : '❌ موقوف';
    const interval = current.interval || '—';
    return api.sendMessage(
      `⏱️ وقت التوسيع في هذا القروب\n\n` +
      `الحالة: ${status}\n` +
      `الوقت الحالي: ${current.interval ? formatSeconds(current.interval) : 'لم يُحدد'}\n\n` +
      `لتغييره: وقت ثواني\nمثال: وقت 30`,
      threadID, messageID
    );
  }

  const seconds = parseFloat(args[0]);
  if (isNaN(seconds) || seconds < MIN_INTERVAL || seconds > MAX_INTERVAL) {
    return api.sendMessage(
      `❌ الوقت يجب أن يكون بين ${MIN_INTERVAL} و${MAX_INTERVAL} ثانية\nمثال: وقت 30`,
      threadID, messageID
    );
  }

  // حفظ بنفس صيغة توسيع.js
  data[tid] = Object.assign({}, current, { mode: 'fixed', interval: seconds });
  saveData(data);

  // إذا كان المؤقت نشطاً → أعد جدولته
  if (current.active && global._tawsi3) {
    if (global._tawsi3[tid]) {
      clearTimeout(global._tawsi3[tid]);
      delete global._tawsi3[tid];
    }
  }

  return api.sendMessage(
    `✅ تم ضبط وقت التوسيع إلى ${formatSeconds(seconds)}${current.active ? '\nℹ️ سيُطبَّق في الإرسال القادم' : ''}`,
    threadID, messageID
  );
};
