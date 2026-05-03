module.exports.config = {
  name: "طرد",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "يطرد عضواً من القروب عبر الرد على رسالته",
  commandCategory: "أوامر",
  usages: "طرد [رد على رسالة العضو]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply } = event;

  const adminIDs = global.config.ADMINBOT || [];
  if (!adminIDs.includes(String(senderID))) {
    try {
      const tInfo = await api.getThreadInfo(threadID);
      const isGroupAdmin = (tInfo.adminIDs || []).some(a => String(a.id) === String(senderID));
      if (!isGroupAdmin)
        return api.sendMessage("❌ هذا الأمر لأدمن البوت أو أدمن القروب فقط", threadID, messageID);
    } catch (e) {
      return api.sendMessage("❌ ليس لديك صلاحية الطرد", threadID, messageID);
    }
  }

  if (!messageReply)
    return api.sendMessage(
      "❌ يجب الرد على رسالة الشخص الذي تريد طرده\nمثال: ارد على رسالته واكتب: طرد",
      threadID, messageID
    );

  const targetID = messageReply.senderID;

  if (String(targetID) === String(senderID))
    return api.sendMessage("❌ لا تقدر تطرد نفسك!", threadID, messageID);

  if (adminIDs.includes(String(targetID)))
    return api.sendMessage("❌ لا يمكن طرد أدمن البوت", threadID, messageID);

  let name = targetID;
  try {
    const info = await api.getUserInfo(targetID);
    name = info[targetID]?.name || targetID;
  } catch (e) {}

  try {
    await api.removeUserFromGroup(targetID, threadID);
    return api.sendMessage(
      `✅ تم طرد: ${name}\nمع السلامة 👋`,
      threadID, messageID
    );
  } catch (e) {
    return api.sendMessage(
      `❌ فشل الطرد\nتأكد أن البوت أدمن في القروب`,
      threadID, messageID
    );
  }
};
