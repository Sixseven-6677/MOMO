module.exports.config = {
  name: "قبول",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "قبول جميع طلبات المراسلة المعلقة تلقائياً",
  commandCategory: "إدارة المحادثات",
  usages: "قبول",
  cooldowns: 10
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  let pending = [];
  try {
    pending = await api.getThreadList(30, null, ["PENDING"]);
  } catch (e) {
    return api.sendMessage("❌ فشل جلب طلبات المراسلة", threadID, messageID);
  }

  if (!pending || !pending.length)
    return api.sendMessage("📭 لا توجد طلبات مراسلة معلقة", threadID, messageID);

  api.sendMessage(`📥 جارٍ قبول ${pending.length} طلب...`, threadID, messageID);

  let success = 0, failed = 0;
  for (const t of pending) {
    try {
      await api.sendMessage("👋 مرحباً!", t.threadID);
      success++;
      await new Promise(r => setTimeout(r, 500));
    } catch (e) { failed++; }
  }

  return api.sendMessage(
    `✅ اكتمل القبول\n✔️ نجح: ${success}\n❌ فشل: ${failed}`,
    threadID
  );
};
