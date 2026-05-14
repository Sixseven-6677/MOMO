module.exports.config = {
  name: "قروبات",
  version: "5.0.0",
  hasPermssion: 3,
  credits: "FANG",
  description: "عرض القروبات الحالية للبوت بأسماء محدّثة",
  commandCategory: "إدارة",
  usages: "قروبات",
  cooldowns: 15
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  try {
    // api.getThreadList — استدعاء واحد يجيب أحدث القروبات مباشرة من Facebook
    const threads = await new Promise((resolve, reject) => {
      api.getThreadList(30, null, ['INBOX'], (err, list) => {
        if (err) return reject(err);
        resolve(list);
      });
    });

    // نصفي القروبات فقط (isGroup) ونحذف المحادثات الفردية
    const groups = threads.filter(t => t.isGroup);

    if (groups.length === 0)
      return api.sendMessage('⚠️ البوت ليس في أي قروب حالياً', threadID, messageID);

    let text = `🌐 ┌─── قروبات البوت ───┐

`;

    groups.forEach((g, i) => {
      const name = g.threadName || g.name || `قروب ${i + 1}`;
      text += `${i + 1}. 💬 ${name}
   🔑 ${g.threadID}

`;
    });

    text += `└──────────────────────┘
📊 إجمالي: ${groups.length} قروب`;

    return api.sendMessage(text, threadID, messageID);

  } catch(err) {
    console.error('[قروبات] getThreadList error:', err.message);

    // fallback: من الذاكرة أو DB
    try {
      const { sequelize } = require('../../includes/database');
      const rows = await sequelize.query(
        'SELECT threadID, threadInfo FROM Threads',
        { type: sequelize.QueryTypes.SELECT }
      );
      const allIDs = [...new Set([
        ...rows.map(r => String(r.threadID)),
        ...(global.data.allThreadID || [])
      ])];

      if (allIDs.length === 0)
        return api.sendMessage('⚠️ لا توجد قروبات مسجلة', threadID, messageID);

      let text = `🌐 ┌─── قروبات البوت (من DB) ───┐

`;
      allIDs.slice(0, 25).forEach((tid, i) => {
        let name = global.data.threadInfo?.get(tid)?.threadName;
        if (!name) {
          try {
            const row = rows.find(r => String(r.threadID) === tid);
            if (row?.threadInfo) {
              const info = typeof row.threadInfo === 'string' ? JSON.parse(row.threadInfo) : row.threadInfo;
              name = info?.threadName;
            }
          } catch(e) {}
        }
        text += `${i + 1}. 💬 ${name || tid}
   🔑 ${tid}

`;
      });
      text += `└──────────────────────┘
📊 إجمالي: ${allIDs.length} قروب`;
      return api.sendMessage(text, threadID, messageID);

    } catch(e2) {
      return api.sendMessage('❌ خطأ: ' + err.message, threadID, messageID);
    }
  }
};
