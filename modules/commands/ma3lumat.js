module.exports.config = {
  name: "معلومات",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "عرض معلومات عضو عبر الرد على رسالته أو كتابة الـ ID",
  commandCategory: "إدارة الغروب",
  usages: "معلومات | معلومات [ID]",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply } = event;

  let targetID = args[0] || (messageReply && messageReply.senderID) || senderID;
  targetID = String(targetID).trim();

  let userInfo, threadInfo;
  try {
    userInfo = await api.getUserInfo(targetID);
    threadInfo = await api.getThreadInfo(threadID);
  } catch (e) {
    return api.sendMessage("❌ فشل جلب المعلومات — تأكد من صحة الـ ID", threadID, messageID);
  }

  const user = userInfo[targetID];
  if (!user) return api.sendMessage("❌ المستخدم غير موجود", threadID, messageID);

  const isAdmin  = (threadInfo.adminIDs || []).includes(targetID);
  const isMember = (threadInfo.participantIDs || []).includes(targetID);
  const isBotAdmin = ((global.config && global.config.ADMINBOT) || []).includes(targetID);

  const name   = user.name || "—";
  const gender = user.gender === 2 ? "ذكر 👦" : user.gender === 1 ? "أنثى 👧" : "—";

  const msg =
`👤 معلومات المستخدم
━━━━━━━━━━━━━━━
📛 الاسم: ${name}
🆔 ID: ${targetID}
━━━━━━━━━━━━━━━
${isBotAdmin ? "👑 أدمن البوت\n" : ""}${isAdmin ? "⭐ أدمن الغروب\n" : ""}${isMember ? "✅ عضو في الغروب" : "❌ ليس عضواً في الغروب"}
━━━━━━━━━━━━━━━
🔗 https://facebook.com/${targetID}`;

  return api.sendMessage(msg, threadID, messageID);
};
