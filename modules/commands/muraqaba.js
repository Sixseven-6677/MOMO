const muraqabaData = global.muraqabaData || (global.muraqabaData = new Map());

module.exports.config = {
  name: "مراقبة",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "مراقبة من يدخل ويخرج من الغروب مع تسجيل الأحداث",
  commandCategory: "إدارة الغروب",
  usages: "مراقبة | مراقبة سجل | مراقبة توقف | مراقبة مسح",
  cooldowns: 0
};

function getData(threadID) {
  if (!muraqabaData.has(threadID))
    muraqabaData.set(threadID, { active: false, log: [] });
  return muraqabaData.get(threadID);
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  const data = getData(threadID);
  const sub  = args[0];

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
    const list = data.log.slice(-20).map(e =>
      (e.type === "join" ? "📥 دخل" : "📤 غادر") + ": " + e.name + "\n" +
      "   🆔 " + e.id + "\n" +
      "   🕐 " + e.time
    ).join("\n\n");
    return api.sendMessage(
      "📋 سجل المراقبة (آخر " + Math.min(20, data.log.length) + " أحداث):\n━━━━━━━━━━\n\n" + list,
      threadID, messageID
    );
  }

  data.active = true;
  return api.sendMessage(
    "👁 تم تفعيل المراقبة\nسيتم تسجيل كل من يدخل أو يخرج من الغروب\n\n" +
    "• مراقبة سجل — عرض السجل\n" +
    "• مراقبة مسح — مسح السجل\n" +
    "• مراقبة توقف — إيقاف",
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  // قبول كل أنواع الأحداث المحتملة
  if (!event) return;
  const type = event.type || "";
  if (type !== "event" && type !== "log:subscribe" && type !== "log:unsubscribe") return;

  const { threadID } = event;
  if (!threadID) return;

  const data = getData(threadID);
  if (!data.active) return;

  const logType = event.logMessageType || event.type || "";
  const logData = event.logMessageData || {};
  const time    = new Date().toISOString().replace("T", " ").slice(0, 19);

  // انضمام عضو
  if (logType === "log:subscribe") {
    const users = logData.addedParticipants || [];
    for (const u of users) {
      let name = u.fullName || u.name || u.firstName || "";
      const id = String(u.userFbId || u.id || "");

      if (!name && id) {
        try {
          const inf = await api.getUserInfo(id);
          name = inf[id]?.name || id;
        } catch(e) { name = id; }
      }
      if (!name) name = id || "—";

      const entry = { type: "join", name, id, time };
      data.log.push(entry);
      if (data.log.length > 200) data.log.shift();

      try {
        await api.sendMessage(
          "📥 انضم إلى الغروب:\n👤 " + name + (id ? ("\n🆔 " + id) : "") + "\n🕐 " + time,
          threadID
        );
      } catch(e) {}
    }
  }

  // مغادرة عضو
  if (logType === "log:unsubscribe") {
    const id = String(logData.leftParticipantFbId || logData.id || "");
    let name  = logData.name || logData.fullName || "";

    if (!name && id) {
      try {
        const inf = await api.getUserInfo(id);
        name = inf[id]?.name || id;
      } catch(e) { name = id; }
    }
    if (!name) name = id || "—";

    const entry = { type: "leave", name, id, time };
    data.log.push(entry);
    if (data.log.length > 200) data.log.shift();

    try {
      await api.sendMessage(
        "📤 غادر الغروب:\n👤 " + name + (id ? ("\n🆔 " + id) : "") + "\n🕐 " + time,
        threadID
      );
    } catch(e) {}
  }
};
