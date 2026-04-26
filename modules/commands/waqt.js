const fs = require("fs");
const path = require("path");
const configPath = path.join(process.cwd(), "config.json");

module.exports.config = {
  name: "وقت",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "تغيير زمن رسالة التوسيع (خافير) بالثواني",
  commandCategory: "أوامر",
  usages: "وقت [عدد الثواني] | وقت (لمعرفة الوقت الحالي)",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const adminIDs = global.config.ADMINBOT || [];
  if (!adminIDs.includes(String(senderID))) {
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);
  }

  const currentMs = parseInt(global.config.xavierInterval) || 30000;

  if (!args[0]) {
    return api.sendMessage(
      `⏱ زمن رسالة التوسيع الحالي: ${currentMs/1000} ثانية\n\n` +
      `لتغييره: وقت [عدد الثواني]\n` +
      `مثال: وقت 60`,
      threadID, messageID
    );
  }

  const seconds = parseInt(args[0]);
  if (isNaN(seconds) || seconds < 1) {
    return api.sendMessage("❌ ادخل رقم صحيح بالثواني أكبر من 0", threadID, messageID);
  }

  const ms = seconds * 1000;
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  config.xavierInterval = ms;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
  global.config.xavierInterval = ms;

  return api.sendMessage(
    `✅ تم تغيير زمن رسالة التوسيع إلى ${seconds} ثانية\n` +
    `⚠️ الجلسات الشغّالة حالياً ستحتاج لإعادة تشغيل الأمر "خافير" لتحديث الوقت`,
    threadID, messageID
  );
};
