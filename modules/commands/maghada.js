module.exports.config = {
  name: "مغادرة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "يغادر البوت قروباً محدداً بالرقم",
  commandCategory: "أوامر",
  usages: "مغادرة {رقم القروب}",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const adminIDs = global.config.ADMINBOT || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  const allThreads = [...(global.data.allThreadID || [])];
  if (allThreads.length === 0)
    return api.sendMessage("❌ لا توجد قروبات مسجلة", threadID, messageID);

  const num = parseInt(args[0]);
  if (isNaN(num) || num < 1 || num > allThreads.length)
    return api.sendMessage(
      `❌ رقم غير صحيح\nالبوت موجود في ${allThreads.length} قروب\nمثال: مغادرة 2`,
      threadID, messageID
    );

  const targetThread = allThreads[num - 1];

  let name = targetThread;
  try {
    const info = global.data.threadInfo?.get(targetThread) || await api.getThreadInfo(targetThread);
    name = info.threadName || targetThread;
  } catch (e) {}

  if (targetThread === threadID)
    return api.sendMessage("⚠️ لا تقدر تطردني من هذا القروب بهذا الأمر", threadID, messageID);

  try {
    await api.sendMessage("👋 وداعاً.. أُمرت بالمغادرة", targetThread);
    await api.removeUserFromGroup(global.botID || senderID, targetThread);
    return api.sendMessage(
      `✅ تم المغادرة بنجاح\nالقروب: ${name}`,
      threadID, messageID
    );
  } catch (e) {
    return api.sendMessage(
      `❌ فشلت المغادرة من: ${name}\nقد لا أكون أدمن في ذلك القروب`,
      threadID, messageID
    );
  }
};
