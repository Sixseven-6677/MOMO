const ismData = global.ismData || (global.ismData = new Map());

module.exports.config = {
  name: "اسم",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "تغيير اسم الكروب مع إمكانية تحديد قروب بالرقم",
  commandCategory: "أوامر",
  usages: "اسم [الاسم] | اسم [الاسم]- قروب [رقم] | اسم توقف",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = global.config.ADMINBOT || [];
  const isAdmin = adminIDs.includes(String(senderID));

  if (args[0] === "توقف") {
    if (ismData.has(threadID)) {
      ismData.delete(threadID);
      return api.sendMessage("✅ تم إيقاف حماية اسم الكروب", threadID, messageID);
    }
    return api.sendMessage("الحماية مو شغالة أصلاً", threadID, messageID);
  }

  if (!args[0]) {
    return api.sendMessage(
      "📝 طريقة الاستخدام:\n" +
      "• اسم مرحبا ← يغير اسم هذا الكروب\n" +
      "• اسم مرحبا- قروب 1 ← يغير اسم القروب رقم 1\n" +
      "• اسم توقف ← يوقف حماية الاسم",
      threadID, messageID
    );
  }

  const fullText = args.join(" ");

  const match = fullText.match(/^(.*?)-\s*قروب\s+(\d+)$/);

  if (match) {
    if (!isAdmin) {
      return api.sendMessage("❌ تغيير اسم قروب آخر لأدمن البوت فقط", threadID, messageID);
    }

    const newName = match[1].trim();
    const groupNum = parseInt(match[2]);

    if (!newName) {
      return api.sendMessage("❌ اكتب الاسم قبل رقم القروب", threadID, messageID);
    }

    const allThreads = [...(global.data.allThreadID || [])];

    if (isNaN(groupNum) || groupNum < 1 || groupNum > allThreads.length) {
      let lines = [];
      let i = 1;
      for (const tid of allThreads) {
        let name = tid;
        try {
          const info = global.data.threadInfo?.get(tid) || await api.getThreadInfo(tid);
          name = info.threadName || `قروب ${tid}`;
        } catch (e) {}
        lines.push(`${i}. ${name}`);
        i++;
      }
      return api.sendMessage(
        `📋 قائمة القروبات:\n\n${lines.join("\n")}\n\nمثال: اسم مرحبا- قروب 2`,
        threadID, messageID
      );
    }

    const targetThreadID = allThreads[groupNum - 1];

    try {
      await api.setTitle(newName, targetThreadID);
      ismData.set(targetThreadID, { name: newName });
      return api.sendMessage(
        `✅ تم تغيير اسم القروب رقم ${groupNum} إلى: ${newName}\n🛡 الحماية شغالة على ذلك الكروب`,
        threadID, messageID
      );
    } catch (e) {
      return api.sendMessage(`❌ فشل تغيير اسم القروب رقم ${groupNum}`, threadID, messageID);
    }

  } else {
    const newName = fullText;

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
