const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "ريستارت",
  version: "1.0.0",
  hasPermssion: 3,
  credits: "MOMO",
  description: "إعادة تشغيل البوت",
  commandCategory: "أوامر",
  usages: "ريستارت",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = global.config.ADMINBOT || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  await api.sendMessage(
    `🔄 جاري إعادة تشغيل البوت...\n⏱ سيعود خلال ثوانٍ`,
    threadID, messageID
  );
  setTimeout(() => process.exit(1), 2000);
};
