const kickedLog = global.kickedLog || (global.kickedLog = new Map());
// Map<threadID, [{id, name, time}]>

module.exports.config = {
  name: "استعادة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "استعادة الأعضاء المطرودين وإضافتهم للغروب مجدداً",
  commandCategory: "إدارة الغروب",
  usages: "استعادة [ID] | استعادة آخر | استعادة سجل",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  const sub = args[0];

  if (sub === "سجل") {
    const log = kickedLog.get(threadID) || [];
    if (!log.length) return api.sendMessage("📭 لا يوجد سجل طرد لهذا الغروب", threadID, messageID);
    const list = log.slice(-10).map((e, i) =>
      `${i + 1}. ${e.name || "—"}\n   🆔 ${e.id}\n   🕐 ${e.time}`
    ).join("\n\n");
    return api.sendMessage(`📋 سجل المطرودين (آخر 10):\n━━━━━━━━━━\n\n${list}`, threadID, messageID);
  }

  if (sub === "آخر") {
    const log = kickedLog.get(threadID) || [];
    const last = log[log.length - 1];
    if (!last) return api.sendMessage("⚠️ لا يوجد مطرود مسجل في هذا الغروب", threadID, messageID);
    try {
      await api.addUserToGroup(last.id, threadID);
      return api.sendMessage(`✅ تمت إعادة ${last.name || last.id} للغروب`, threadID, messageID);
    } catch (e) {
      return api.sendMessage(`❌ فشلت الاستعادة: ${e.message}`, threadID, messageID);
    }
  }

  // استعادة بـ ID مباشر
  const ids = args.filter(a => /^\d+$/.test(a));
  if (!ids.length)
    return api.sendMessage(
      "الاستخدام:\n• استعادة [ID] — إعادة شخص محدد\n• استعادة آخر — إعادة آخر مطرود\n• استعادة سجل — عرض المطرودين",
      threadID, messageID
    );

  let ok = 0, fail = 0;
  for (const id of ids) {
    try {
      await api.addUserToGroup(id, threadID);
      ok++;
      await new Promise(r => setTimeout(r, 500));
    } catch (e) { fail++; }
  }
  return api.sendMessage(
    `✅ الاستعادة اكتملت\n✔️ نجح: ${ok}\n❌ فشل: ${fail}`,
    threadID, messageID
  );
};

// تسجيل الطرد تلقائياً عند المغادرة القسرية
module.exports.handleEvent = async function({ api, event }) {
  if (event.type !== "event") return;
  if (event.logMessageType !== "log:unsubscribe") return;
  const { threadID, logMessageData } = event;
  const id = String(logMessageData?.leftParticipantFbId || "");
  if (!id) return;
  if (!kickedLog.has(threadID)) kickedLog.set(threadID, []);
  const log = kickedLog.get(threadID);
  log.push({ id, name: logMessageData?.name || "—", time: new Date().toLocaleString("ar-SA") });
  if (log.length > 50) log.shift();
};
