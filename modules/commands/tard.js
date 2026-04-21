module.exports.config = {
  name: "طرد",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "طرد شخص عند الرد على رسالته",
  commandCategory: "أوامر",
  usages: "طرد (مع الرد على رسالة الشخص)",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID, messageReply } = event;

  const adminIDs = global.config.ADMINBOT || [];
  if (!adminIDs.includes(String(senderID))) {
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);
  }

  if (!messageReply) {
    return api.sendMessage(
      "⚠️ يجب الرد على رسالة الشخص المراد طرده\n\nمثال: رد على رسالة ثم اكتب طرد",
      threadID, messageID
    );
  }

  const targetID = String(messageReply.senderID);

  if (targetID === String(senderID)) {
    return api.sendMessage("❌ لا تقدر تطرد نفسك", threadID, messageID);
  }

  if (adminIDs.includes(targetID)) {
    return api.sendMessage("❌ لا تقدر تطرد أدمن البوت", threadID, messageID);
  }

  let name = targetID;
  try {
    const info = await api.getUserInfo(targetID);
    name = info[targetID]?.name || targetID;
  } catch (e) {}

  try {
    await api.removeUserFromGroup(targetID, threadID);
    return api.sendMessage(
      `— 𝖴𝗌𝖾𝗋 𝗁𝖺𝗌 𝖻𝖾𝖾𝗇 𝗋𝖾𝗆𝗈𝗏𝖾𝖽 ꗇ\n\n👤 ${name}`,
      threadID, messageID
    );
  } catch (e) {
    return api.sendMessage(
      `❌ فشل الطرد\nتأكد أن البوت أدمن في القروب`,
      threadID, messageID
    );
  }
};
