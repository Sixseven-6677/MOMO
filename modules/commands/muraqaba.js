const muraqabaData = global.muraqabaData || (global.muraqabaData = new Map());
// Map<threadID, { active, log: [{type, name, id, time}] }>

module.exports.config = {
  name: "مراقبة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "مراقبة من يدخل ويخرج من الغروب مع تسجيل الأحداث",
  commandCategory: "إدارة الغروب",
  usages: "مراقبة | مراقبة سجل | مراقبة توقف | مراقبة مسح",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  const sub = args[0];

  if (!muraqabaData.has(threadID))
    muraqabaData.set(threadID, { active: false, log: [] });
  const data = muraqabaData.get(threadID);

  if (sub === "توقف") {
    data.active = false;
    return api.sendMessage("✅ تم إيقاف المراقبة", threadID, messageID);
  }

  if (sub === "مسح") {
    data.log = [];
    return api.sendMessage("✅ تم مسح سجل المراقبة", threadID, messageID);
  }

  if (sub === "سجل") {
    if (!data.log.length)
      return api.sendMessage("📭 السجل فارغ", threadID, messageID);
    const list = data.log.slice(-15).map(e =>
      `${e.type === "join" ? "➕" : "➖"} ${e.name} (${e.id})\n   🕐 ${e.time}`
    ).join("\n\n");
    return api.sendMessage(
      `📋 سجل المراقبة (آخر ${Math.min(15, data.log.length)} أحداث):\n━━━━━━━━━━\n\n${list}`,
      threadID, messageID
    );
  }

  data.active = true;
  return api.sendMessage(
    `👁 تم تفعيل المراقبة\nسيتم تسجيل كل من يدخل أو يخرج\n\n• مراقبة سجل — عرض السجل\n• مراقبة مسح — مسح السجل\n• مراقبة توقف — إيقاف`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  if (event.type !== "event") return;
  const { threadID, logMessageType, logMessageData } = event;
  if (!muraqabaData.has(threadID)) return;
  const data = muraqabaData.get(threadID);
  if (!data.active) return;

  const time = new Date().toLocaleString("ar-SA");

  if (logMessageType === "log:subscribe") {
    const users = logMessageData?.addedParticipants || [];
    for (const u of users) {
      const entry = { type: "join", name: u.fullName || "—", id: String(u.userFbId || ""), time };
      data.log.push(entry);
      try { await api.sendMessage(`📥 انضم: ${entry.name}\n🆔 ${entry.id}\n🕐 ${time}`, threadID); } catch(e){}
    }
  }

  if (logMessageType === "log:unsubscribe") {
    const id = String(logMessageData?.leftParticipantFbId || "");
    const name = logMessageData?.name || "—";
    if (!id) return;
    const entry = { type: "leave", name, id, time };
    data.log.push(entry);
    try { await api.sendMessage(`📤 غادر: ${name}\n🆔 ${id}\n🕐 ${time}`, threadID); } catch(e){}
  }
};
