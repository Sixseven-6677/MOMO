module.exports.config = {
  name: "خروج",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "إخراج البوت من الغروب الحالي أو غروب محدد",
  commandCategory: "إدارة المحادثات",
  usages: "خروج | خروج [ID الغروب]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  const targetThread = args[0] || threadID;
  const isSameThread = targetThread === threadID;

  try {
    let botID;
    try { botID = api.getCurrentUserID(); } catch(e) {}

    if (!botID)
      return api.sendMessage("❌ تعذر معرفة ID البوت", threadID, messageID);

    if (!isSameThread) {
      await api.sendMessage("✅ تم إخراج البوت من الغروب بأمر الأدمن", threadID, messageID);
    }

    await api.removeUserFromGroup(botID, targetThread);
  } catch (e) {
    return api.sendMessage(
      `❌ فشل الخروج من الغروب\n${e.message || "تأكد من صلاحيات البوت"}`,
      threadID, messageID
    );
  }
};
