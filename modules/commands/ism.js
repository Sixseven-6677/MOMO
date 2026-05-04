const ismData = global.ismData || (global.ismData = new Map());

module.exports.config = {
  name: "اسم",
  version: "3.1.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "تغيير اسم الكروب مع الحماية من التغيير",
  commandCategory: "أوامر",
  usages: "اسم [الاسم] | اسم توقف | اسم حماية | اسم حماية لا",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args[0]) {
    return api.sendMessage(
      `اوامر الاسم:\n` +
      `- اسم [الاسم] ← تغيير الاسم مع تفعيل الحماية\n` +
      `- اسم حماية ← تفعيل الحماية للاسم الحالي\n` +
      `- اسم حماية لا ← إيقاف الحماية\n` +
      `- اسم توقف ← إيقاف الحماية`,
      threadID, messageID
    );
  }

  if (args[0] === "توقف" || (args[0] === "حماية" && args[1] === "لا")) {
    if (ismData.has(threadID)) {
      ismData.delete(threadID);
      return api.sendMessage("✅ تم إيقاف حماية الاسم", threadID, messageID);
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
      `✅ حماية الاسم مفعلة\nالاسم المحمي: ${currentName}\nللإيقاف: اسم توقف`,
      threadID, messageID
    );
  }

  const newName = args.join(" ");

  try {
    await api.setTitle(newName, threadID);
    ismData.set(threadID, { name: newName });
    return api.sendMessage(
      `✅ تم تغيير اسم الكروب\nالاسم الجديد: ${newName}\n🛡 الحماية مفعلة\nللإيقاف: اسم توقف`,
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
