module.exports.config = {
  name: "اضافة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "إضافة شخص للقروب الحالي عن طريق ID أو إضافة نفسك",
  commandCategory: "أوامر",
  usages: "اضافة [ID] | اضافة (لإضافة نفسك)",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const adminIDs = global.config.ADMINBOT || [];
  if (!adminIDs.includes(String(senderID))) {
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);
  }

  let targetID = String(args[0] || "").trim();
  if (!targetID) targetID = String(senderID);

  if (!/^\d{8,}$/.test(targetID)) {
    return api.sendMessage("❌ ID غير صحيح\nاكتب: اضافة <ID> أو اضافة لإضافة نفسك", threadID, messageID);
  }

  try {
    await api.addUserToGroup(targetID, threadID);
    let name = targetID;
    try {
      const info = await api.getUserInfo(targetID);
      name = info[targetID]?.name || targetID;
    } catch (e) {}
    return api.sendMessage(`✅ تمت إضافة ${name} (${targetID}) إلى القروب`, threadID, messageID);
  } catch (e) {
    return api.sendMessage(
      `❌ فشلت الإضافة\nالأسباب المحتملة:\n• الشخص لا يقبل إضافات الغرباء\n• البوت ليس عضواً في القروب\n• ID غير صحيح`,
      threadID, messageID
    );
  }
};
