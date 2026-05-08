module.exports.config = {
  name: "بينق",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "قياس سرعة استجابة البوت",
  commandCategory: "النظام",
  usages: "بينق",
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  const start = Date.now();
  await api.sendMessage("🏓 Pong!", threadID, messageID);
  const ms = Date.now() - start;
  return api.sendMessage(
    `✅ البوت شغال\n⚡ زمن الاستجابة: ${ms}ms\n🕐 ${new Date().toLocaleTimeString("ar-SA")}`,
    threadID
  );
};
