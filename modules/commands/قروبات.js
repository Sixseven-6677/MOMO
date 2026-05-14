module.exports.config = {
  name: "قروبات",
  version: "2.0.0",
  hasPermssion: 3,
  credits: "FANG",
  description: "عرض القروبات الحالية للبوت",
  commandCategory: "إدارة",
  usages: "قروبات",
  cooldowns: 10
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  try {
    // أولاً: حاول جلب القروبات من قاعدة البيانات مباشرةً (أكثر موثوقية)
    const { sequelize } = require('../../includes/database');
    const rows = await sequelize.query(
      'SELECT threadID, threadInfo FROM Threads',
      { type: sequelize.QueryTypes.SELECT }
    );

    // دمج نتائج DB مع ما في الذاكرة (إن وجد)
    const dbIDs = rows.map(r => String(r.threadID));
    const memIDs = [...(global.data.allThreadID || [])];
    const allIDs = [...new Set([...dbIDs, ...memIDs])];

    if (allIDs.length === 0)
      return api.sendMessage('⚠️ البوت ليس في أي قروب حالياً', threadID, messageID);

    let text = `🌐 ┌─── قروبات البوت ───┐

`;
    let count = 0;

    for (const tid of allIDs) {
      count++;

      // حاول جلب اسم القروب من الذاكرة أولاً ثم من DB
      let name = `قروب ${count}`;
      try {
        const memInfo = global.data.threadInfo.get(tid);
        if (memInfo?.threadName) {
          name = memInfo.threadName;
        } else {
          const row = rows.find(r => String(r.threadID) === tid);
          if (row?.threadInfo) {
            const info = typeof row.threadInfo === 'string'
              ? JSON.parse(row.threadInfo)
              : row.threadInfo;
            if (info?.threadName) name = info.threadName;
          }
        }
      } catch(e) {}

      text += `${count}. 💬 ${name}
   🔑 ${tid}

`;

      if (count >= 25) {
        const remaining = allIDs.length - 25;
        if (remaining > 0) text += `...و ${remaining} قروب آخر
`;
        break;
      }
    }

    text += `└──────────────────────┘
📊 الإجمالي: ${allIDs.length} قروب`;
    return api.sendMessage(text, threadID, messageID);

  } catch(err) {
    console.error('[قروبات] DB error:', err.message);
    // fallback: الذاكرة فقط
    const threadIDs = [...(global.data.allThreadID || [])];
    if (threadIDs.length === 0)
      return api.sendMessage('⚠️ لا يوجد قروبات مسجلة حالياً
(حاول مرة بعد وصول رسالة)', threadID, messageID);

    let text = `🌐 ┌─── قروبات البوت ───┐

`;
    let count = 0;
    for (const tid of threadIDs) {
      count++;
      let name = `قروب ${count}`;
      try {
        const info = global.data.threadInfo.get(tid);
        if (info?.threadName) name = info.threadName;
      } catch(e) {}
      text += `${count}. 💬 ${name}
   🔑 ${tid}

`;
      if (count >= 25) break;
    }
    text += `└──────────────────────┘
📊 الإجمالي: ${threadIDs.length} قروب`;
    return api.sendMessage(text, threadID, messageID);
  }
};
