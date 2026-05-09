module.exports.config = {
  name: "محادثات",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "إدارة المحادثات — طلبات المراسلة الواردة والـ Spam والغروبات الحالية",
  commandCategory: "إدارة المحادثات",
  usages: "محادثات طلبات | محادثات غروبات",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  const sub = (args[0] || "").trim();

  if (sub === "غروبات") {
    try {
      const threads = await api.getThreadList(50, null, ["INBOX"]);
      const groups = threads.filter(t => t.isGroup && t.threadName);
      if (!groups.length)
        return api.sendMessage("📭 لا توجد غروبات حالية", threadID, messageID);

      const list = groups.map((g, i) =>
        (i + 1) + ". " + g.threadName + "\n   🆔 " + g.threadID + "\n   👥 " + (g.participantIDs?.length || "؟") + " عضو"
      ).join("\n\n");

      return api.sendMessage(
        "🏘️ الغروبات الحالية (" + groups.length + "):\n━━━━━━━━━━━━━━━\n\n" + list,
        threadID, messageID
      );
    } catch (e) {
      return api.sendMessage("❌ خطأ: " + e.message, threadID, messageID);
    }
  }

  if (sub === "طلبات") {
    try {
      let pending = [];

      // PENDING inbox
      try {
        const p = await api.getThreadList(30, null, ["PENDING"]);
        if (Array.isArray(p)) pending = [...pending, ...p];
      } catch (e) {}

      // SPAM inbox
      try {
        const s = await api.getThreadList(30, null, ["SPAM"]);
        if (Array.isArray(s)) pending = [...pending, ...s];
      } catch (e) {}

      // إزالة المكررات
      const seen = new Set();
      pending = pending.filter(t => {
        if (seen.has(t.threadID)) return false;
        seen.add(t.threadID);
        return true;
      });

      if (!pending.length)
        return api.sendMessage("📭 لا توجد طلبات مراسلة معلقة أو رسائل مرفوضة", threadID, messageID);

      const list = pending.map((t, i) => {
        const name = t.threadName || t.name || t.threadID;
        const isGroup = t.isGroup ? " 👥" : " 👤";
        return (i + 1) + ". " + name + isGroup + "\n   🆔 " + t.threadID;
      }).join("\n\n");

      return api.sendMessage(
        "💬 طلبات المراسلة المعلقة (" + pending.length + "):\n━━━━━━━━━━━━━━━\n\n" + list + "\n\n" +
        "لقبول طلب: قبول [رقم]\nلرفض: رفض [رقم]",
        threadID, messageID
      );
    } catch (e) {
      return api.sendMessage("❌ خطأ: " + e.message, threadID, messageID);
    }
  }

  return api.sendMessage(
    "💬 إدارة المحادثات:\n\n" +
    "• محادثات طلبات — عرض طلبات المراسلة المعلقة والـ Spam\n" +
    "• محادثات غروبات — عرض جميع الغروبات الحالية",
    threadID, messageID
  );
};
