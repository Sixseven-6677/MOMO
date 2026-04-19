const himayaIsmData = global.himayaIsmData || (global.himayaIsmData = new Map());

module.exports.config = {
  name: "حمايةاسم",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "حماية اسم الكروب من التغيير ويرجع تلقائياً",
  commandCategory: "أوامر",
  usages: "حمايةاسم [الاسم] | حمايةاسم توقف",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (args[0] === "توقف") {
    if (himayaIsmData.has(threadID)) {
      himayaIsmData.delete(threadID);
      return api.sendMessage("🛡 تم إيقاف حماية الاسم", threadID, messageID);
    }
    return api.sendMessage("حماية الاسم مو شغالة أصلاً", threadID, messageID);
  }

  let nameToProtect;

  if (args[0]) {
    nameToProtect = args.join(" ");
    try {
      await api.setTitle(nameToProtect, threadID);
    } catch (e) {}
  } else {
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      nameToProtect = threadInfo.threadName || null;
    } catch (e) {}
  }

  if (!nameToProtect) {
    return api.sendMessage(
      "❌ ما في اسم للكروب، اكتب الاسم بعد الأمر\nمثال: حمايةاسم XAVIER",
      threadID, messageID
    );
  }

  himayaIsmData.set(threadID, { name: nameToProtect });

  return api.sendMessage(
    `🛡 تم تفعيل حماية الاسم\n📝 الاسم المحمي: ${nameToProtect}\nأي شخص يغيره سيرجع تلقائياً\n\nللإيقاف: حمايةاسم توقف`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  if (event.logMessageType !== "log:thread-name") return;
  const { threadID } = event;

  if (!himayaIsmData.has(threadID)) return;

  const { name } = himayaIsmData.get(threadID);

  const newName = event.logMessageData?.name || "";
  if (newName === name) return;

  setTimeout(async () => {
    if (!himayaIsmData.has(threadID)) return;
    try {
      await api.setTitle(name, threadID);
    } catch (e) {}
  }, 2000);
};
