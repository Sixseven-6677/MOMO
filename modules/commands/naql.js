module.exports.config = {
  name: "نقل",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "إضافة شخص إلى قروب آخر عن طريق تاج أو ID مباشرة",
  commandCategory: "أوامر",
  usages: "نقل @شخص [رقم] | نقل [ID] [رقم]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, mentions } = event;

  const adminIDs = global.config.ADMINBOT || [];
  if (!adminIDs.includes(String(senderID))) {
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);
  }

  const mentionedIDs = Object.keys(mentions || {});

  let targetIDs = [];
  let targetNames = {};

  if (mentionedIDs.length > 0) {
    targetIDs = mentionedIDs;
    targetNames = { ...mentions };
  } else {
    const firstArg = String(args[0] || "").trim();
    if (firstArg && /^\d{10,}$/.test(firstArg)) {
      targetIDs = [firstArg];
      try {
        const info = await api.getUserInfo(firstArg);
        targetNames[firstArg] = info[firstArg]?.name || firstArg;
      } catch (e) {
        targetNames[firstArg] = firstArg;
      }
    } else {
      return api.sendMessage(
        "❌ حدد الشخص عن طريق:\n• تاج: نقل @شخص 2\n• ID مباشرة: نقل 1234567890 2",
        threadID, messageID
      );
    }
  }

  const allThreads = [...global.data.allThreadID];
  const numArg = args.find(a => /^\d+$/.test(a) && a.length < 10);
  const num = parseInt(numArg);

  if (!numArg || isNaN(num) || num < 1 || num > allThreads.length) {
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
    const example = targetIDs[0]?.length >= 10
      ? `نقل ${targetIDs[0]} 2`
      : `نقل @شخص 2`;
    return api.sendMessage(
      `❌ حدد رقم القروب:\n\n` + lines.join("\n") +
      `\n\nمثال: ${example}`,
      threadID, messageID
    );
  }

  const targetThread = allThreads[num - 1];
  let groupName = targetThread;
  try {
    const info = global.data.threadInfo.get(targetThread) || await api.getThreadInfo(targetThread);
    groupName = info.threadName || targetThread;
  } catch (e) {}

  let results = [];
  for (const uid of targetIDs) {
    const name = targetNames[uid] || uid;
    try {
      await api.addUserToGroup(uid, targetThread);
      results.push(`✅ ${name} - تمت الإضافة`);
    } catch (e) {
      results.push(`❌ ${name} - فشلت الإضافة`);
    }
  }

  return api.sendMessage(
    `➢ نقل الأعضاء إلى: ${groupName}\n\n` + results.join("\n"),
    threadID, messageID
  );
};
