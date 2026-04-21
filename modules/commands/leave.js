module.exports.config = {
  name: "اطلع برا",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "إخراج البوت من القروب",
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

  await new Promise(res => api.sendMessage("𝖦𝗈𝗈𝖽𝖻𝗒𝖾 👋", threadID, () => res(), messageID));
  await new Promise(r => setTimeout(r, 1500));

  const botID = api.getCurrentUserID();
  let left = false;

  try {
    await new Promise((res, rej) => {
      api.removeUserFromGroup(botID, threadID, (err) => err ? rej(err) : res());
    });
    left = true;
  } catch (e) {}

  if (!left) {
    try {
      if (typeof api.leaveThread === "function") {
        await new Promise((res, rej) => {
          api.leaveThread(threadID, (err) => err ? rej(err) : res());
        });
        left = true;
      }
    } catch (e) {}
  }

  if (!left) {
    try {
      if (typeof api.deleteThread === "function") {
        await new Promise((res) => api.deleteThread(threadID, () => res()));
        left = true;
      }
    } catch (e) {}
  }

  if (!left) {
    try { api.sendMessage("❌ تعذر الخروج، البوت يحتاج صلاحية أدمن في الكروب", threadID); } catch (e) {}
  }
};
