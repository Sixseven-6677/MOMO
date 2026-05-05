module.exports.config = {
  name: "ريستارت",
  version: "2.0.0",
  hasPermssion: 0,
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

  // نرسل الرسالة وعند تأكيد الإرسال نخرج فوراً
  api.sendMessage(
    `🔄 جاري إعادة تشغيل البوت...\n⏱ سيعود خلال ثوانٍ`,
    threadID,
    () => {
      // نخرج بـ exit code 1 لكي يعيد index.js التشغيل تلقائياً
      process.exit(1);
    },
    messageID
  );
};
