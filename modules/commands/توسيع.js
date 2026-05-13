const fs   = require("fs");
const path = require("path");
const dataPath = path.join(process.cwd(), "modules/commands/data/tawsi3.json");

function loadData() {
  try { return JSON.parse(fs.readFileSync(dataPath, "utf8")); } catch(e) { return {}; }
}
function saveData(obj) {
  try {
    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(obj, null, 2));
  } catch(e) {}
}

const cooldownMap = new Map();
const DEFAULT_MSG = "👀 نشاط مكتشف! هل تريد الانضمام لنا؟ تواصل مع البوت 🤖";

module.exports.config = {
  name: "توسيع",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "FANG",
  description: "يرسل رسالة في القروب عند اكتشاف نشاط | توسيع رسالة [نص] | توسيع كسر",
  commandCategory: "أدوات",
  usages: "توسيع | توسيع رسالة [النص] | توسيع كسر",
  cooldowns: 3
};

module.exports.onLoad = function() {
  if (!global.tawsi3Data) global.tawsi3Data = {};
  const data = loadData();
  Object.assign(global.tawsi3Data, data);
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  if (!global.tawsi3Data) global.tawsi3Data = {};
  const data = loadData();
  const sub = args[0];

  if (sub === "كسر") {
    if (!data[threadID]) return api.sendMessage("⚠️ التوسيع غير مفعّل في هذا القروب", threadID, messageID);
    delete data[threadID];
    delete global.tawsi3Data[threadID];
    saveData(data);
    return api.sendMessage("✅ تم إيقاف التوسيع في هذا القروب", threadID, messageID);
  }

  if (sub === "رسالة") {
    const msg = args.slice(1).join(" ").trim();
    if (!msg) return api.sendMessage("❌ اكتب الرسالة بعد الأمر\nمثال: توسيع رسالة مرحباً بكم في قروبنا!", threadID, messageID);
    if (!data[threadID]) data[threadID] = { active: true, msg: DEFAULT_MSG };
    data[threadID].msg = msg;
    global.tawsi3Data[threadID] = data[threadID];
    saveData(data);
    return api.sendMessage(`✅ تم تحديث رسالة التوسيع:\n\n"${msg}"`, threadID, messageID);
  }

  // Enable
  if (data[threadID]?.active) {
    const existing = data[threadID].msg || DEFAULT_MSG;
    return api.sendMessage(`⚠️ التوسيع مفعّل بالفعل\nالرسالة الحالية: "${existing}"\n\nلتغيير الرسالة: توسيع رسالة [النص]\nللإيقاف: توسيع كسر`, threadID, messageID);
  }

  data[threadID] = { active: true, msg: DEFAULT_MSG };
  global.tawsi3Data[threadID] = data[threadID];
  saveData(data);
  return api.sendMessage(
    `✅ تم تفعيل التوسيع\n\n📢 الرسالة الحالية:\n"${DEFAULT_MSG}"\n\nلتغيير الرسالة: توسيع رسالة [النص]\nللإيقاف: توسيع كسر`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  try {
    if (!global.tawsi3Data) return;
    const { threadID, senderID, type } = event;
    if (type !== "message" && type !== "message_reply") return;
    if (senderID === api.getCurrentUserID()) return;

    const entry = global.tawsi3Data[threadID];
    if (!entry?.active) return;

    const now = Date.now();
    const last = cooldownMap.get(threadID) || 0;
    if (now - last < 3 * 60 * 1000) return; // 3 minutes cooldown per group
    cooldownMap.set(threadID, now);

    api.sendMessage(entry.msg || DEFAULT_MSG, threadID);
  } catch(e) {}
};