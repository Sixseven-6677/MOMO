const tarhib = global.tarhib || (global.tarhib = new Map());

module.exports.config = {
  name: "ترحيب",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "رسالة ترحيب تلقائية عند انضمام أعضاء جدد",
  commandCategory: "إدارة الغروب",
  usages: "ترحيب [رسالة] | ترحيب توقف | ترحيب عرض",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  const sub = args[0];

  if (sub === "توقف") {
    tarhib.delete(threadID);
    return api.sendMessage("✅ تم إيقاف رسالة الترحيب", threadID, messageID);
  }

  if (sub === "عرض") {
    const msg = tarhib.get(threadID);
    if (!msg) return api.sendMessage("⚠️ لا توجد رسالة ترحيب مفعّلة", threadID, messageID);
    return api.sendMessage(`📋 رسالة الترحيب الحالية:\n\n${msg}`, threadID, messageID);
  }

  const message = args.join(" ").trim();
  if (!message)
    return api.sendMessage(
      "الاستخدام:\n• ترحيب [رسالة] — تفعيل الترحيب\n• ترحيب توقف — إيقاف\n• ترحيب عرض — عرض الرسالة\n\nيمكن استخدام {اسم} لاسم العضو",
      threadID, messageID
    );

  tarhib.set(threadID, message);
  return api.sendMessage(
    `✅ تم تفعيل رسالة الترحيب\n\n📝 "${message}"\n\nعند انضمام أي عضو سيُرسل هذا تلقائياً`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  if (event.type !== "event") return;
  if (event.logMessageType !== "log:subscribe") return;

  const { threadID, logMessageData } = event;
  if (!tarhib.has(threadID)) return;

  const addedUsers = logMessageData?.addedParticipants || [];
  if (!addedUsers.length) return;

  let msg = tarhib.get(threadID);

  for (const user of addedUsers) {
    const name = user.fullName || user.name || "العضو الجديد";
    const personalMsg = msg.replace(/\{اسم\}/g, name);
    try {
      await api.sendMessage(`👋 ${personalMsg}`, threadID);
    } catch (e) {}
  }
};
