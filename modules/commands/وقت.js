const fs   = require("fs");
const path = require("path");

const dataPath = path.join(process.cwd(), "modules/commands/data/tawsi3.json");

function loadData() {
  try { return JSON.parse(fs.readFileSync(dataPath, "utf8")); }
  catch(e) { return {}; }
}
function saveData(obj) {
  try {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(obj, null, 2));
  } catch(e) {}
}

module.exports.config = {
  name: "وقت",
  version: "2.0.0",
  hasPermssion: 3,
  credits: "FANG",
  description: "يتحكم في الوقت (بالثواني) بين ردود التوسيع",
  commandCategory: "أدوات",
  usages: "وقت [ثوانٍ] — مثال: وقت 60",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  const data    = loadData();
  const current = data[threadID] || { active: false, msg: "", timeout: 30 };

  if (!args[0]) {
    const status = current.active ? "✅ مفعّل" : "❌ موقوف";
    return api.sendMessage(
      `⏱️ وقت التوسيع في هذا القروب\n\n` +
      `الحالة: ${status}\n` +
      `الوقت الحالي: ${current.timeout || 30} ثانية\n\n` +
      `لتغييره: وقت [ثوانٍ]\nمثال: وقت 60`,
      threadID, messageID
    );
  }

  const seconds = parseInt(args[0]);
  if (isNaN(seconds) || seconds < 5 || seconds > 3600)
    return api.sendMessage("❌ الوقت يجب أن يكون بين 5 و 3600 ثانية\nمثال: وقت 30", threadID, messageID);

  // حفظ كل الحقول مع تحديث الوقت فقط — لا يُمسّ active أو msg
  data[threadID] = { ...current, timeout: seconds };
  saveData(data);

  const mins = seconds >= 60
    ? ` (${Math.floor(seconds / 60)} دقيقة${seconds % 60 ? " و" + seconds % 60 + " ثانية" : ""})`
    : "";
  return api.sendMessage(
    `✅ تم تحديث وقت التوسيع إلى ${seconds} ثانية${mins}`,
    threadID, messageID
  );
};
