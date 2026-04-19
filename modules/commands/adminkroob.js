module.exports.config = {
  name: "ادمنقروب",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "إضافة البوت كأدمن في قروب محدد",
  commandCategory: "أوامر",
  usages: "ادمنقروب [رقم القروب]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const adminIDs = global.config.ADMINBOT || [];
  if (!adminIDs.includes(String(senderID))) {
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);
  }

  const allThreads = [...global.data.allThreadID];
  const num = parseInt(args[0]);

  if (!args[0] || isNaN(num) || num < 1 || num > allThreads.length) {
    let lines = [];
    let i = 1;
    for (const tid of allThreads) {
      let name = tid;
      try {
        const info = global.data.threadInfo.get(tid) || await api.getThreadInfo(tid);
        name = info.threadName || `قروب ${tid}`;
      } catch (e) {}
      lines.push(`${i}. ${name}`);
      i++;
    }
    return api.sendMessage(
      `📋 اختر رقم القروب لإضافة البوت كأدمن فيه:\n\n` +
      lines.join("\n") +
      `\n\nمثال: ادمنقروب 2`,
      threadID, messageID
    );
  }

  const targetThread = allThreads[num - 1];
  let groupName = targetThread;
  try {
    const info = global.data.threadInfo.get(targetThread) || await api.getThreadInfo(targetThread);
    groupName = info.threadName || targetThread;
  } catch (e) {}

  let botID;
  try {
    botID = await api.getCurrentUserID();
  } catch (e) {
    botID = global.config.BOTID || null;
  }

  if (!botID) {
    return api.sendMessage("❌ ما قدرت أحدد ID البوت", threadID, messageID);
  }

  try {
    await api.changeAdminStatus(targetThread, botID, true);
    return api.sendMessage(
      `✅ تم تعيين البوت كأدمن في:\n${groupName}`,
      threadID, messageID
    );
  } catch (e) {
    return api.sendMessage(
      `❌ فشل التعيين في: ${groupName}\nتأكد أن البوت موجود في القروب وعنده صلاحيات`,
      threadID, messageID
    );
  }
};
