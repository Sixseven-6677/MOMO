const fs = require("fs");
const path = require("path");
const configPath = path.join(process.cwd(), "config.json");

if (!global.ighlaqData) global.ighlaqData = new Map();

module.exports.config = {
  name: "اغلاق",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "التحكم في استجابة البوت للرسائل في القروب",
  commandCategory: "أوامر",
  usages: "اغلاق جزئي | اغلاق كلي | اغلاق تعطيل",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const adminIDs = (global.config && global.config.ADMINBOT) ||
    JSON.parse(fs.readFileSync(configPath, "utf8")).ADMINBOT || [];

  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  const sub = args[0];

  if (sub === "جزئي") {
    global.ighlaqData.set(threadID, "partial");
    return api.sendMessage("🔕", threadID, messageID);
  }

  if (sub === "كلي") {
    global.ighlaqData.set(threadID, "full");
    return api.sendMessage("🔇", threadID, messageID);
  }

  if (sub === "تعطيل" || sub === "توقف") {
    global.ighlaqData.delete(threadID);
    return api.sendMessage("✅", threadID, messageID);
  }

  const current = global.ighlaqData.get(threadID);
  const statusText = !current
    ? "🟢 مفعّل"
    : current === "partial"
    ? "🔕 جزئي"
    : "🔇 كلي";

  return api.sendMessage(
    `الحالة: ${statusText}\n\nاغلاق جزئي | اغلاق كلي | اغلاق تعطيل`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, type } = event;
  if (type !== "message") return;

  const mode = global.ighlaqData && global.ighlaqData.get(threadID);
  if (!mode) return;

  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  const isAdmin = adminIDs.includes(String(senderID));

  if (mode === "full" && !isAdmin) return;
  if (mode === "partial" && !isAdmin) return;
};
