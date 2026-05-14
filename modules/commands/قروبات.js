module.exports.config = {
  name: "قروبات",
  version: "3.0.0",
  hasPermssion: 3,
  credits: "FANG",
  description: "عرض القروبات الحالية للبوت مع الأسماء المحدّثة",
  commandCategory: "إدارة",
  usages: "قروبات",
  cooldowns: 15
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  await api.sendMessage('⏳ جاري جلب القروبات...', threadID);

  try {
    // جمع IDs من DB + الذاكرة
    const { sequelize } = require('../../includes/database');
    const rows = await sequelize.query(
      'SELECT threadID FROM Threads',
      { type: sequelize.QueryTypes.SELECT }
    );

    const dbIDs   = rows.map(r => String(r.threadID));
    const memIDs  = [...(global.data.allThreadID || [])];
    const allIDs  = [...new Set([...dbIDs, ...memIDs])];

    if (allIDs.length === 0)
      return api.sendMessage('⚠️ البوت ليس في أي قروب حالياً', threadID, messageID);

    // جلب أسماء حية من Facebook API (أول 25 فقط)
    const targets = allIDs.slice(0, 25);
    const results = [];

    for (const tid of targets) {
      try {
        const info = await new Promise((res, rej) => {
          api.getThreadInfo(tid, (err, data) => err ? rej(err) : res(data));
        });
        const name = info?.threadName || info?.name || `قروب ${tid}`;
        results.push({ tid, name });
      } catch(e) {
        // إذا فشل جلب المعلومات، استخدم الاسم من الذاكرة كـ fallback
        const memInfo = global.data.threadInfo?.get(tid);
        results.push({ tid, name: memInfo?.threadName || `قروب ${tid}` });
      }
    }

    let text = `🌐 ┌─── قروبات البوت ───┐

`;
    results.forEach((r, i) => {
      text += `${i + 1}. 💬 ${r.name}
   🔑 ${r.tid}

`;
    });

    const remaining = allIDs.length - targets.length;
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
