module.exports.config = {
  name: "إرسال",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "إرسال رسالة لأي غروب عن طريق الـ ID",
  commandCategory: "إدارة المحادثات",
  usages: "إرسال [ID الغروب] [الرسالة]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  const targetThread = args[0];
  const message = args.slice(1).join(" ").trim();

  if (!targetThread || !message)
    return api.sendMessage(
      "❌ الاستخدام الصحيح:\nإرسال [ID الغروب] [نص الرسالة]",
      threadID, messageID
    );

  try {
    await api.sendMessage(message, targetThread);
    return api.sendMessage(
      `✅ تم إرسال الرسالة بنجاح إلى الغروب\n🆔 ${targetThread}`,
      threadID, messageID
    );
  } catch (e) {
    return api.sendMessage(
      `❌ فشل الإرسال\n${e.message || "تأكد من صحة الـ ID"}`,
      threadID, messageID
    );
  }
};
