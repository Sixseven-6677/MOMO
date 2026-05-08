const wada3Data = global.wada3Data || (global.wada3Data = new Map());

module.exports.config = {
  name: "وداع",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "رسالة وداع تلقائية عند مغادرة أعضاء الغروب",
  commandCategory: "إدارة الغروب",
  usages: "وداع [رسالة] | وداع توقف | وداع عرض",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  const sub = args[0];

  if (sub === "توقف") {
    wada3Data.delete(threadID);
    return api.sendMessage("✅ تم إيقاف رسالة الوداع", threadID, messageID);
  }

  if (sub === "عرض") {
    const msg = wada3Data.get(threadID);
    if (!msg) return api.sendMessage("⚠️ لا توجد رسالة وداع مفعّلة", threadID, messageID);
    return api.sendMessage(`📋 رسالة الوداع الحالية:\n\n${msg}`, threadID, messageID);
  }

  const message = args.join(" ").trim();
  if (!message)
    return api.sendMessage(
      "الاستخدام:\n• وداع [رسالة] — تفعيل\n• وداع توقف — إيقاف\n• وداع عرض — عرض الرسالة\n\nيمكن استخدام {اسم} لاسم العضو",
      threadID, messageID
    );

  wada3Data.set(threadID, message);
  return api.sendMessage(
    `✅ تم تفعيل رسالة الوداع\n\n📝 "${message}"`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  if (event.type !== "event") return;
  if (event.logMessageType !== "log:unsubscribe") return;

  const { threadID, logMessageData } = event;
  if (!wada3Data.has(threadID)) return;

  const leftUsers = logMessageData?.leftParticipantFbId
    ? [{ userFbId: logMessageData.leftParticipantFbId }]
    : [];
  if (!leftUsers.length) return;

  let msg = wada3Data.get(threadID);
  const name = logMessageData?.name || "العضو";
  const personalMsg = msg.replace(/\{اسم\}/g, name);

  try {
    await api.sendMessage(`👋 ${personalMsg}`, threadID);
  } catch (e) {}
};
