const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'modules/commands/data/tawsi3.json');

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

module.exports.config = {
  name: "تحديث",
  version: "1.1.0",
  hasPermssion: 3,
  credits: "FANG",
  description: "تحديث رسالة التوسيع في هذا القروب",
  commandCategory: "أدوات",
  usages: "تحديث رسالة نص الرسالة",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  // المستخدم يكتب: تحديث رسالة النص هنا
  // args[0] = "رسالة" ، args[1..] = النص
  const message = (args[0] === 'رسالة' ? args.slice(1) : args).join(' ').trim();

  if (!message) {
    return api.sendMessage(
      '❌ اكتب نص الرسالة\n\nمثال: تحديث رسالة مرحباً بالجميع!',
      threadID, messageID
    );
  }

  const data = loadData();
  const tid  = String(threadID);
  data[tid]  = Object.assign({}, data[tid] || {}, { message });
  saveData(data);

  const isActive = data[tid]?.active;
  const status   = isActive
    ? '✅ تم التحديث وسيُطبَّق في الإرسال القادم'
    : '✅ تم حفظ الرسالة';

  return api.sendMessage(
    `${status}\n\n💬 الرسالة الجديدة:\n"${message}"`,
    threadID, messageID
  );
};
