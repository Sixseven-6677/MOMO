module.exports.config = {
  name: "حذف",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "حذف الرسالة عن طريق الرد عليها وكتابة حذف",
  commandCategory: "أوامر",
  usages: "حذف",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, messageReply } = event;

  if (!messageReply) {
    return api.unsendMessage(messageID);
  }

  try {
    await api.unsendMessage(messageReply.messageID);
  } catch (e) {
    api.sendMessage("❌ ما قدرت أحذف الرسالة", threadID, messageID);
  }
};

module.exports.handleEvent = async function({ api, event }) {
  if (!event.body) return;
  const body = event.body.trim();
  const { threadID, messageID, messageReply } = event;

  if (body === "حذف") {
    if (!messageReply) return;
    try {
      await api.unsendMessage(messageReply.messageID);
    } catch (e) {}
  }
};
