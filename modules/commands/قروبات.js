module.exports.config = {
  name: "قروبات",
  version: "1.0.0",
  hasPermssion: 3,
  credits: "FANG",
  description: "عرض القروبات الحالية للبوت",
  commandCategory: "إدارة",
  usages: "قروبات",
  cooldowns: 10
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  const threadIDs = [...(global.data.allThreadID || [])].filter(id => id !== String(event.senderID));
  if (threadIDs.length === 0)
    return api.sendMessage("⚠️ البوت ليس في أي قروب حالياً", threadID, messageID);

  let text = `🌐 ┌─── قروبات البوت ───┐\n\n`;
  let count = 0;
  for (const tid of threadIDs) {
    count++;
    let name = `قروب ${count}`;
    try {
      const tInfo = global.data.threadInfo.get(tid);
      if (tInfo?.threadName) name = tInfo.threadName;
    } catch(e) {}
    text += `${count}. 💬 ${name}\n   🔑 ${tid}\n\n`;
    if (count >= 25) {
      const remaining = threadIDs.length - 25;
      if (remaining > 0) text += `...و ${remaining} قروب آخر\n`;
      break;
    }
  }
  text += `└──────────────────────┘\n📊 الإجمالي: ${threadIDs.length} قروب`;
  return api.sendMessage(text, threadID, messageID);
};