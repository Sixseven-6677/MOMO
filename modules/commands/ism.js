const ismData = global.ismData || (global.ismData = new Map());

module.exports.config = {
  name: "اسم",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "تغيير اسم الكروب مع الحماية من التغيير",
  commandCategory: "أوامر",
  usages: "اسم [الاسم] | اسم توقف | اسم حماية | اسم حماية لا",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args[0]) {
    return api.sendMessage(
      `𝗡𝖺𝗆𝖾 𝖢𝗈𝗆𝗆𝖺𝗇𝖽𝗌:\n` +
      `- اسم [الاسم] ← تغيير الاسم مع تفعيل الحماية\n` +
      `- اسم حماية ← تفعيل الحماية للاسم الحالي\n` +
      `- اسم حماية لا ← إيقاف الحماية فقط\n` +
      `- اسم توقف ← إيقاف الحماية`,
      threadID, messageID
    );
  }

  if (args[0] === "توقف" || (args[0] === "حماية" && args[1] === "لا")) {
    if (ismData.has(threadID)) {
      ismData.delete(threadID);
      return api.sendMessage("— 𝖭𝖺𝗆𝖾 𝗉𝗋𝗈𝗍𝖾𝖼𝗍𝗂𝗈𝗇 𝗁𝖺𝗌 𝖻𝖾𝖾𝗇 𝖽𝗂𝗌𝖺𝖻𝗅𝖾𝖽 ꗇ", threadID, messageID);
    }
    return api.sendMessage("⚠️ حماية الاسم مو شغالة أصلاً", threadID, messageID);
  }

  if (args[0] === "حماية") {
    let currentName;
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      currentName = threadInfo.threadName || null;
    } catch (e) {}

    if (!currentName) {
      return api.sendMessage("❌ ما في اسم للكروب حالياً", threadID, messageID);
    }

    ismData.set(threadID, { name: currentName });
    return api.sendMessage(
      `— 𝖭𝖺𝗆𝖾 𝗉𝗋𝗈𝗍𝖾𝖼𝗍𝗂𝗈𝗇 𝗁𝖺𝗌 𝖻𝖾𝖾𝗇 𝖾𝗇𝖺𝖻𝗅𝖾𝖽 ꗇ\n\n𝖯𝗋𝗈𝗍𝖾𝖼𝗍𝖾𝖽 𝗇𝖺𝗆𝖾: ${currentName}\n\n𝖥𝗈𝗋 𝗌𝗍𝗈𝗉𝗉𝗂𝗇𝗀: اسم توقف`,
      threadID, messageID
    );
  }

  const newName = args.join(" ");

  try {
    await api.setTitle(newName, threadID);
    ismData.set(threadID, { name: newName });
    return api.sendMessage(
      `— 𝖭𝖺𝗆𝖾 𝗁𝖺𝗌 𝖻𝖾𝖾𝗇 𝖼𝗁𝖺𝗇𝗀𝖾𝖽 ꗇ\n\n𝖭𝖾𝗐 𝗇𝖺𝗆𝖾: ${newName}\n🛡 𝖯𝗋𝗈𝗍𝖾𝖼𝗍𝗂𝗈𝗇 𝗂𝗌 𝗈𝗇\n\n𝖥𝗈𝗋 𝗌𝗍𝗈𝗉𝗉𝗂𝗇𝗀: اسم توقف`,
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
