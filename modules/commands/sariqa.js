module.exports.config = {
  name: "سرقة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "يضيف البوت 50 عضو عشوائياً من قروب آخر إلى قروبك",
  commandCategory: "أوامر",
  usages: "سرقة {رقم القروب}",
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
      `❌ رقم غير صحيح\nالبوت موجود في ${allThreads.length} قروب\nمثال: سرقة 2`,
      threadID, messageID
    );

  const sourceThread = allThreads[num - 1];
  if (sourceThread === threadID)
    return api.sendMessage("❌ لا تقدر تسرق من قروبك الحالي", threadID, messageID);

  let sourceName = sourceThread;
  let members = [];
  try {
    const info = await api.getThreadInfo(sourceThread);
    sourceName = info.threadName || sourceThread;
    members = (info.participantIDs || []).filter(id => id !== String(global.botID));
  } catch (e) {
    return api.sendMessage("❌ فشل الحصول على معلومات القروب", threadID, messageID);
  }

  if (members.length === 0)
    return api.sendMessage("❌ لم يتم العثور على أعضاء في ذلك القروب", threadID, messageID);

  const shuffled = members.sort(() => Math.random() - 0.5).slice(0, 50);

  await api.sendMessage(
    `⚡ جاري سرقة ${shuffled.length} عضو من:\n${sourceName}\n\nقد تستغرق العملية بعض الوقت...`,
    threadID, messageID
  );

  let success = 0;
  let failed = 0;
  for (const uid of shuffled) {
    try {
      await api.addUserToGroup(uid, threadID);
      success++;
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      failed++;
    }
  }

  return api.sendMessage(
    `✅ اكتملت السرقة من: ${sourceName}\n\n` +
    `✔️ تمت الإضافة: ${success} عضو\n` +
    `✖️ فشل: ${failed} عضو`,
    threadID
  );
};
