module.exports.config = {
  name: "طلبات",
  version: "2.0.0",
  hasPermssion: 3,
  credits: "FANG",
  description: "عرض القروبات الموجودة في قائمة الانتظار والسبام",
  commandCategory: "إدارة",
  usages: "طلبات",
  cooldowns: 10
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  // دالة مساعدة: getThreadList مع timeout 8 ثوانٍ
  function getList(tag) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve([]), 8000);
      try {
        api.getThreadList(25, null, [tag], (err, list) => {
          clearTimeout(timer);
          resolve(!err && Array.isArray(list) ? list : []);
        });
      } catch(e) {
        clearTimeout(timer);
        resolve([]);
      }
    });
  }

  const [pending, spam] = await Promise.all([
    getList('PENDING'),
    getList('SPAM')
  ]);

  // فلتر: قروبات فقط
  const pGroups = pending.filter(t => t.isGroup);
  const sGroups = spam.filter(t => t.isGroup);

  if (pGroups.length === 0 && sGroups.length === 0)
    return api.sendMessage('✅ لا توجد قروبات معلقة أو سبام', threadID, messageID);

  let text = '📋 ┌── القروبات المعلقة ──┐

';

  if (pGroups.length > 0) {
    text += `📥 الانتظار (${pGroups.length}):
`;
    pGroups.forEach((t, i) => {
      text += `${i+1}. ${t.threadName || 'بدون اسم'}
   🔑 ${t.threadID}

`;
    });
  }

  if (sGroups.length > 0) {
    text += `⚠️ السبام (${sGroups.length}):
`;
    sGroups.forEach((t, i) => {
      text += `${i+1}. ${t.threadName || 'بدون اسم'}
   🔑 ${t.threadID}

`;
    });
  }

  text += '└────────────────────────┘';
  return api.sendMessage(text, threadID, messageID);
};
