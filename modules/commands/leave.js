module.exports.config = {
  name: "اطلع برا",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "إخراج البوت من القروب بدون طرد",
  commandCategory: "أوامر",
  usages: "اطلع برا",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const adminIDs = global.config.ADMINBOT || [];
  if (!adminIDs.includes(String(senderID))) {
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);
  }

  await api.sendMessage("𝖦𝗈𝗈𝖽𝖻𝗒𝖾 👋", threadID, messageID);

  try {
    await api.removeUserFromGroup(api.getCurrentUserID(), threadID);
  } catch (e) {
    try {
      await api.leaveThread(threadID);
    } catch (err) {}
  }
};
