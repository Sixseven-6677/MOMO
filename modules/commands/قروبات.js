module.exports.config = {
  name: "قروبات",
  version: "6.0.0",
  hasPermssion: 3,
  credits: "FANG",
  description: "عرض القروبات الحالية للبوت (القروبات الفعلية فقط)",
  commandCategory: "إدارة",
  usages: "قروبات",
  cooldowns: 15
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  const botID = String(api.getCurrentUserID());

  try {
    const threads = await new Promise((resolve, reject) => {
      api.getThreadList(50, null, ['INBOX'], (err, list) => {
        if (err) return reject(err);
        resolve(list);
      });
    });

    // فلتر: قروبات فقط + البوت لا يزال مشاركاً فيها
    const groups = threads.filter(t => {
      if (!t.isGroup) return false;
      // participantIDs مصفوفة strings أو objects — نتعامل مع الحالتين
      const ids = (t.participantIDs || []).map(p => String(p.id || p));
      return ids.includes(botID);
    });

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
    console.error('[قروبات] error:', err.message);
    return api.sendMessage('❌ خطأ: ' + err.message, threadID, messageID);
  }
};
