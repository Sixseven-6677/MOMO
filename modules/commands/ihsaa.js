module.exports.config = {
  name: "إحصاء",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "إحصاءات الغروب الحالي",
  commandCategory: "إدارة الغروب",
  usages: "إحصاء",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  let info;
  try {
    info = await api.getThreadInfo(threadID);
  } catch (e) {
    return api.sendMessage("❌ فشل جلب معلومات الغروب", threadID, messageID);
  }

  const totalMembers = info.participantIDs?.length || 0;
  const admins = info.adminIDs?.length || 0;
  const name = info.threadName || "بدون اسم";
  const emoji = info.emoji || "لا يوجد";
  const theme = info.color || "افتراضي";
  const created = info.timestamp ? new Date(info.timestamp).toLocaleDateString("ar-SA") : "—";

  // إحصاء الأدمن اللي في البوت
  const botAdminCount = (info.adminIDs || []).filter(id =>
    adminIDs.includes(String(id))
  ).length;

  const msg =
`📊 إحصاءات الغروب
━━━━━━━━━━━━━━━
📌 الاسم: ${name}
🆔 ID: ${threadID}
━━━━━━━━━━━━━━━
👥 الأعضاء: ${totalMembers}
👑 الأدمن: ${admins}
🤖 أدمن البوت في الغروب: ${botAdminCount}
━━━━━━━━━━━━━━━
😊 الإيموجي: ${emoji}
📅 تاريخ أول رسالة: ${created}
━━━━━━━━━━━━━━━`;

  return api.sendMessage(msg, threadID, messageID);
};
