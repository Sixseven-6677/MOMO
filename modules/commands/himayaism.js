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
    `— 𝖭𝖺𝗆𝖾 𝗉𝗋𝗈𝗍𝖾𝖼𝗍𝗂𝗈𝗇 𝗁𝖺𝗌 𝖻𝖾𝖾𝗇 𝖾𝗇𝖺𝖻𝗅𝖾𝖽 ꗇ\n\n𝖳𝗁𝖾 𝗇𝖺𝗆𝖾 𝗂𝗌 𝗉𝗋𝗈𝗍𝖾𝖼𝗍𝖾𝖽 ; 𝖺𝗇𝗒𝗈𝗇𝖾 𝗐𝗁𝗈 𝖼𝗁𝖺𝗇𝗀𝖾𝗌 𝗂𝗍 𝗐𝗂𝗅𝗅 𝗁𝖺𝗏𝖾 𝗍𝗈 𝗋𝖾𝗏𝖾𝗋𝗍 𝗍𝗈 𝗂𝗍\n\n𝖥𝗈𝗋 𝗌𝗍𝗈𝗉𝗉𝗂𝗇𝗀: حمايةاسم توقف`,
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
