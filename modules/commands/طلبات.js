module.exports.config = {
  name: "طلبات",
  version: "3.0.0",
  hasPermssion: 1,
  credits: "FANG",
  description: "عرض القروبات الموجودة في قائمة الانتظار والسبام",
  commandCategory: "إدارة",
  usages: "طلبات",
  cooldowns: 10
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  // إرسال رسالة "جاري البحث..." أولاً حتى يعرف المستخدم أن الأمر يعمل
  let loadingMsg = null;
  try {
    await new Promise((res) => {
      api.sendMessage('🔍 جاري البحث عن الطلبات المعلقة...', threadID, (err, info) => {
        if (!err && info) loadingMsg = info.messageID;
        res();
      });
    });
  } catch(e) {}

  // دالة مساعدة: getThreadList مع timeout 12 ثانية
  function getList(tag) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({ list: [], error: 'timeout' });
      }, 12000);
      try {
        api.getThreadList(30, null, [tag], (err, list) => {
          clearTimeout(timer);
          if (err) {
            resolve({ list: [], error: String(err.error || err) });
          } else {
            resolve({ list: Array.isArray(list) ? list : [], error: null });
          }
        });
      } catch(e) {
        clearTimeout(timer);
        resolve({ list: [], error: String(e.message || e) });
      }
    });
  }

  const [pendingResult, spamResult] = await Promise.all([
    getList('PENDING'),
    getList('SPAM')
  ]);

  // حذف رسالة "جاري البحث"
  if (loadingMsg) {
    try { api.unsendMessage(loadingMsg); } catch(e) {}
  }

  const pGroups = pendingResult.list.filter(t => t.isGroup);
  const sGroups = spamResult.list.filter(t => t.isGroup);

  // إذا فشلت كلتا الطلبيتين
  if (pendingResult.error && spamResult.error) {
    const errMsg = pendingResult.error === 'timeout'
      ? '⚠️ انتهت مهلة الاتصال بـ Facebook API.\n\nقد يكون البوت محظوراً أو API معطّل مؤقتاً.'
      : `⚠️ خطأ في الاتصال:\n${pendingResult.error}`;
    return api.sendMessage(errMsg, threadID, messageID);
  }

  if (pGroups.length === 0 && sGroups.length === 0) {
    let msg = '✅ لا توجد قروبات معلقة أو سبام';
    if (pendingResult.error || spamResult.error) {
      msg += '\n\n⚠️ ملاحظة: حدث خطأ في جلب بعض البيانات، قد تكون النتائج غير مكتملة.';
    }
    return api.sendMessage(msg, threadID, messageID);
  }

  let text = '📋 ┌── القروبات المعلقة ──┐\n\n';

  if (pGroups.length > 0) {
    text += `📥 الانتظار (${pGroups.length}):\n`;
    pGroups.forEach((t, i) => {
      text += `${i + 1}. ${t.name || t.threadName || 'بدون اسم'}\n   🔑 ${t.threadID}\n\n`;
    });
  }

  if (sGroups.length > 0) {
    text += `⚠️ السبام (${sGroups.length}):\n`;
    sGroups.forEach((t, i) => {
      text += `${i + 1}. ${t.name || t.threadName || 'بدون اسم'}\n   🔑 ${t.threadID}\n\n`;
    });
  }

  text += '└────────────────────────┘';
  return api.sendMessage(text, threadID, messageID);
};
