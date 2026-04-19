const ismData = global.ismData || (global.ismData = new Map());

module.exports.config = {
  name: "اسم",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "تغيير اسم الكروب مع الحماية من التغيير",
  commandCategory: "أوامر",
  usages: "اسم [الاسم] | اسم توقف",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (args[0] === "توقف") {
    if (ismData.has(threadID)) {
      ismData.delete(threadID);
      return api.sendMessage("✅ تم إيقاف حماية اسم الكروب", threadID, messageID);
    }
    return api.sendMessage("الحماية مو شغالة أصلاً", threadID, messageID);
  }

  if (!args[0]) {
    return api.sendMessage("اكتب الاسم الجديد للكروب\nمثال: اسم XAVIER\nللإيقاف: اسم توقف", threadID, messageID);
  }

  const newName = args.join(" ");

  try {
    await api.setTitle(newName, threadID);
    ismData.set(threadID, { name: newName });
    return api.sendMessage(
      `✅ تم تغيير اسم الكروب إلى: ${newName}\n🛡 الحماية شغالة، إذا أحد غيّره سيرجع تلقائياً\nللإيقاف: اسم توقف`,
      threadID, messageID
    );
  } catch (e) {
    return api.sendMessage("❌ فشل تغيير اسم الكروب", threadID, messageID);
  }
};

module.exports.handleEvent = async function({ api, event }) {
  if (event.logMessageType !== "log:thread-name") return;
  const { threadID } = event;

  if (!ismData.has(threadID)) return;

  const { name } = ismData.get(threadID);
  const newName = event.logMessageData?.name || "";
  if (newName === name) return;

  setTimeout(async () => {
    if (!ismData.has(threadID)) return;
    try {
      await api.setTitle(name, threadID);
    } catch (e) {}
  }, 2000);
};
