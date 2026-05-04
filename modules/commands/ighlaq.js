const fs = require("fs");
const path = require("path");
const configPath = path.join(process.cwd(), "config.json");

if (!global.ighlaqData) global.ighlaqData = new Map();

module.exports.config = {
  name: "اغلاق",
  version: "1.1.0",
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
    return api.sendMessage(
      `🔕 الإغلاق الجزئي مفعّل\nالبوت يتجاهل رسائل غير أدمن البوت في هذا القروب\n\nللتعطيل: اغلاق تعطيل`,
      threadID, messageID
    );
  }

  if (sub === "كلي") {
    global.ighlaqData.set(threadID, "full");
    return api.sendMessage(
      `🔇 الإغلاق الكلي مفعّل\nالبوت لن يرد على أحد في هذا القروب\n\nللتعطيل: اغلاق تعطيل`,
      threadID, messageID
    );
  }

  if (sub === "تعطيل" || sub === "توقف") {
    global.ighlaqData.delete(threadID);
    return api.sendMessage(
      `✅ تم التعطيل\nالبوت يرد بشكل طبيعي على الجميع`,
      threadID, messageID
    );
  }

  const current = global.ighlaqData.get(threadID);
  const statusText = !current
    ? "🟢 مفعّل بشكل طبيعي"
    : current === "partial"
    ? "🔕 إغلاق جزئي (يرد على الأدمن فقط)"
    : "🔇 إغلاق كلي (لا يرد على أحد)";

  return api.sendMessage(
    `⚙️ حالة البوت في هذا القروب:\n${statusText}\n\nاغلاق جزئي ← يتجاهل غير أدمن البوت\naغلاق كلي ← يتجاهل الجميع\nاغلاق تعطيل ← يعود للرد الطبيعي`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, type } = event;
  if (type !== "message") return;

  const mode = global.ighlaqData && global.ighlaqData.get(threadID);
  if (!mode) return;

  const adminIDs = (global.config && global.config.ADMINBOT) || [];

  if (mode === "full" && !adminIDs.includes(String(senderID))) {
    return api.sendMessage("🔇 البوت في وضع الإغلاق الكلي", threadID);
  }

  if (mode === "partial" && !adminIDs.includes(String(senderID))) {
    return api.sendMessage("🔒 البوت في وضع الإغلاق الجزئي\nيرد على أدمن البوت فقط", threadID);
  }
};
