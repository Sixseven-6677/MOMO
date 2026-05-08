module.exports.config = {
  name: "بث",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "إرسال رسالة بث لجميع الغروبات الحالية",
  commandCategory: "إدارة المحادثات",
  usages: "بث [الرسالة]",
  cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  const message = args.join(" ").trim();
  if (!message)
    return api.sendMessage("❌ الاستخدام: بث [نص الرسالة]", threadID, messageID);

  let threads = [];
  try {
    threads = await api.getThreadList(50, null, ["INBOX"]);
    threads = threads.filter(t => t.isGroup);
  } catch (e) {
    return api.sendMessage("❌ فشل جلب قائمة الغروبات", threadID, messageID);
  }

  if (!threads.length)
    return api.sendMessage("📭 لا توجد غروبات للبث", threadID, messageID);

  api.sendMessage(
    `📡 جارٍ إرسال البث لـ ${threads.length} غروب...\n\n📝 "${message}"`,
    threadID, messageID
  );

  let success = 0, failed = 0;
  for (const t of threads) {
    try {
      await new Promise(r => setTimeout(r, 800));
      await api.sendMessage(`📢 بث من الإدارة:\n\n${message}`, t.threadID);
      success++;
    } catch (e) { failed++; }
  }

  return api.sendMessage(
    `✅ اكتمل البث\n📤 نجح: ${success}\n❌ فشل: ${failed}`,
    threadID
  );
};
