module.exports.config = {
  name: "إرسال",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "إرسال رسالة لقروب محدد بالرقم من قائمة قروبات",
  commandCategory: "إدارة المحادثات",
  usages: "إرسال [رقم] [الرسالة] | إرسال كل [الرسالة]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  if (!args[0])
    return api.sendMessage(
      "📖 الاستخدام:\n" +
      "• إرسال [رقم] [رسالة] — إرسال لقروب محدد\n" +
      "• إرسال كل [رسالة] — إرسال لجميع القروبات\n\n" +
      "اكتب قروبات أولاً لمعرفة أرقام القروبات",
      threadID, messageID
    );

  // إرسال لكل القروبات
  if (args[0] === "كل") {
    const message = args.slice(1).join(" ").trim();
    if (!message) return api.sendMessage("❌ اكتب الرسالة بعد كلمة كل", threadID, messageID);

    const allThreads = [...(global.data?.allThreadID || [])];
    if (!allThreads.length) return api.sendMessage("❌ لا توجد قروبات مسجلة", threadID, messageID);

    await api.sendMessage("📤 جاري الإرسال لـ " + allThreads.length + " قروب...", threadID, messageID);

    let success = 0, failed = 0;
    for (const tid of allThreads) {
      try { await api.sendMessage(message, tid); success++; } catch(e) { failed++; }
      await new Promise(r => setTimeout(r, 500));
    }

    return api.sendMessage(
      "✅ اكتمل الإرسال\n✔️ نجح: " + success + "\n✖️ فشل: " + failed,
      threadID, messageID
    );
  }

  // إرسال بالرقم
  const num = parseInt(args[0]);
  const message = args.slice(1).join(" ").trim();

  if (isNaN(num) || !message)
    return api.sendMessage("❌ الاستخدام: إرسال [رقم] [رسالة]\nاكتب قروبات أولاً لمعرفة الأرقام", threadID, messageID);

  // جلب قائمة القروبات
  let allThreads = (global._currentThreads || []).map(t => t.threadID || t);
  if (!allThreads.length) allThreads = [...(global.data?.allThreadID || [])];

  if (!allThreads.length)
    return api.sendMessage("❌ لا توجد قروبات — اكتب قروبات أولاً لتحديث القائمة", threadID, messageID);

  if (num < 1 || num > allThreads.length)
    return api.sendMessage("❌ الرقم " + num + " غير صحيح\nعدد القروبات: " + allThreads.length, threadID, messageID);

  const targetThread = String(allThreads[num - 1]);

  let name = targetThread;
  try {
    const info = global.data?.threadInfo?.get(targetThread) || await api.getThreadInfo(targetThread);
    name = info.threadName || targetThread;
  } catch(e) {}

  try {
    await api.sendMessage(message, targetThread);
    return api.sendMessage("✅ تم إرسال الرسالة بنجاح إلى:\n" + name, threadID, messageID);
  } catch (e) {
    return api.sendMessage("❌ فشل الإرسال إلى: " + name + "\n" + (e.message || ""), threadID, messageID);
  }
};
