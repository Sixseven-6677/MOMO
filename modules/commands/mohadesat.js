module.exports.config = {
  name: "محادثات",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "إدارة المحادثات — طلبات المراسلة والغروبات الحالية",
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

  // ── الغروبات الحالية ──────────────────────────────
  if (sub === "غروبات") {
    try {
      const threads = await api.getThreadList(50, null, ["INBOX"]);
      const groups = threads.filter(t => t.isGroup && t.threadName);
      if (!groups.length)
        return api.sendMessage("📭 لا توجد غروبات حالية", threadID, messageID);

      const list = groups.map((g, i) =>
        `${i + 1}. ${g.threadName}\n   🆔 ${g.threadID}\n   👥 ${g.participantIDs?.length || "؟"} عضو`
      ).join("\n\n");

      return api.sendMessage(
        `🏘️ الغروبات الحالية (${groups.length}):\n━━━━━━━━━━━━━━━\n\n${list}`,
        threadID, messageID
      );
    } catch (e) {
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }

  // ── طلبات المراسلة ────────────────────────────────
  if (sub === "طلبات") {
    try {
      const pending = await api.getThreadList(20, null, ["PENDING"]);
      if (!pending || !pending.length)
        return api.sendMessage("📭 لا توجد طلبات مراسلة معلقة", threadID, messageID);

      const list = pending.map((t, i) => {
        const name = t.threadName || t.name || t.threadID;
        return `${i + 1}. ${name}\n   🆔 ${t.threadID}`;
      }).join("\n\n");

      return api.sendMessage(
        `💬 طلبات المراسلة المعلقة (${pending.length}):\n━━━━━━━━━━━━━━━\n\n${list}\n\n` +
        `لقبول طلب: إرسال [ID] [رسالة]`,
        threadID, messageID
      );
    } catch (e) {
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }

  // ── مساعدة ────────────────────────────────────────
  return api.sendMessage(
    `💬 إدارة المحادثات:\n\n` +
    `• محادثات طلبات — عرض طلبات المراسلة المعلقة\n` +
    `• محادثات غروبات — عرض جميع الغروبات الحالية`,
    threadID, messageID
  );
};
