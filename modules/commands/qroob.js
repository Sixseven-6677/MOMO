module.exports.config = {
  name: "قروب",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "تنفيذ إجراءات على قروب محدد بالرقم (إضافة، اسم، الخ)",
  commandCategory: "أوامر",
  usages: "قروب [رقم] اضافة [ID] | قروب [رقم] اضافة (لإضافة نفسك)",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const adminIDs = global.config.ADMINBOT || [];
  if (!adminIDs.includes(String(senderID))) {
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);
  }

  const allThreads = [...(global.data.allThreadID || [])];
  const num = parseInt(args[0]);

  if (!args[0] || isNaN(num) || num < 1 || num > allThreads.length) {
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
      `📋 قائمة القروبات:\n\n${lines.join("\n")}\n\n` +
      `أمثلة:\n` +
      `• قروب 1 اضافة 1234567890\n` +
      `• قروب 2 اضافة (لإضافة نفسك)`,
      threadID, messageID
    );
  }

  const targetThreadID = allThreads[num - 1];
  const action = String(args[1] || "").trim();

  if (action === "اضافة") {
    let targetID = String(args[2] || "").trim();
    if (!targetID) targetID = String(senderID);

    if (!/^\d{8,}$/.test(targetID)) {
      return api.sendMessage("❌ ID غير صحيح", threadID, messageID);
    }

    try {
      await api.addUserToGroup(targetID, targetThreadID);
      let name = targetID;
      try {
        const info = await api.getUserInfo(targetID);
        name = info[targetID]?.name || targetID;
      } catch (e) {}

      let groupName = `قروب ${num}`;
      try {
        const tinfo = global.data.threadInfo?.get(targetThreadID) || await api.getThreadInfo(targetThreadID);
        groupName = tinfo.threadName || groupName;
      } catch (e) {}

      return api.sendMessage(
        `✅ تمت إضافة ${name} (${targetID}) إلى: ${groupName}`,
        threadID, messageID
      );
    } catch (e) {
      return api.sendMessage(
        `❌ فشلت الإضافة\n• الشخص قد لا يقبل إضافات الغرباء\n• تأكد أن البوت موجود في القروب`,
        threadID, messageID
      );
    }
  }

  return api.sendMessage(
    `❌ إجراء غير معروف: ${action}\nالإجراءات المتاحة:\n• اضافة [ID]`,
    threadID, messageID
  );
};
