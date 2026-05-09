module.exports.config = {
  name: "ريستارت",
  version: "2.0.0",
  hasPermssion: 3,
  credits: "MOMO",
  description: "إعادة تشغيل البوت",
  commandCategory: "أوامر",
  usages: "ريستارت",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  api.sendMessage(
    `🔄 جاري إعادة تشغيل البوت...\n⏱ سيعود خلال ثوانٍ`,
    threadID,
    () => { process.exit(1); },
    messageID
  );
};