module.exports.config = {
  name: "قروبات",
  version: "4.0.0",
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
    // جلب IDs من قاعدة البيانات
    const { sequelize } = require('../../includes/database');
    const rows = await sequelize.query(
      'SELECT threadID, threadInfo FROM Threads',
      { type: sequelize.QueryTypes.SELECT }
    );

    // دمج مع الذاكرة لضمان عدم فقدان أي قروب
    const dbIDs  = rows.map(r => String(r.threadID));
    const memIDs = [...(global.data.allThreadID || [])];
    const allIDs = [...new Set([...dbIDs, ...memIDs])];

    if (allIDs.length === 0)
      return api.sendMessage('⚠️ البوت ليس في أي قروب حالياً', threadID, messageID);

    let text = `🌐 ┌─── قروبات البوت ───┐

`;
    const shown = allIDs.slice(0, 25);

    for (let i = 0; i < shown.length; i++) {
      const tid = shown[i];
      let name = null;

      // 1) من الذاكرة أولاً (أحدث)
      try { name = global.data.threadInfo?.get(tid)?.threadName; } catch(e){}

      // 2) من DB إذا الذاكرة فارغة
      if (!name) {
        try {
          const row = rows.find(r => String(r.threadID) === tid);
          if (row?.threadInfo) {
            const info = typeof row.threadInfo === 'string'
              ? JSON.parse(row.threadInfo) : row.threadInfo;
            name = info?.threadName;
          }
        } catch(e) {}
      }

      text += `${i + 1}. 💬 ${name || tid}
   🔑 ${tid}

`;
    }

    const remaining = allIDs.length - shown.length;
    if (remaining > 0) text += `...و ${remaining} قروب آخر
`;
    text += `└──────────────────────┘
📊 الإجمالي: ${allIDs.length} قروب`;

    return api.sendMessage(text, threadID, messageID);

  } catch(err) {
    console.error('[قروبات] error:', err.message);
    return api.sendMessage('❌ حدث خطأ: ' + err.message, threadID, messageID);
  }
};
