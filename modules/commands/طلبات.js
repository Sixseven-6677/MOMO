module.exports.config = {
  name: "طلبات",
  version: "1.0.0",
  hasPermssion: 3,
  credits: "FANG",
  description: "عرض القروبات الموجودة في قائمة الانتظار والسبام",
  commandCategory: "إدارة",
  usages: "طلبات",
  cooldowns: 10
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  api.sendMessage("🔄 جاري جلب القروبات المعلقة...", threadID, async (err, info) => {
    try {
      const pending = await new Promise((res, rej) =>
        api.getThreadList(25, null, ["PENDING"], (e, t) => e ? rej(e) : res(t || []))
      );
      const spam = await new Promise((res, rej) =>
        api.getThreadList(25, null, ["SPAM"], (e, t) => e ? rej(e) : res(t || []))
      ).catch(() => []);

      let text = "📋 ┌── القروبات المعلقة ──┐\n\n";

      if (pending.length === 0 && spam.length === 0) {
        text += "✅ لا توجد قروبات معلقة\n";
      } else {
        if (pending.length > 0) {
          text += `📥 الانتظار (${pending.length}):\n`;
          pending.forEach((t, i) => text += `${i+1}. ${t.threadName || t.threadID}\n   🔑 ${t.threadID}\n\n`);
        }
        if (spam.length > 0) {
          text += `⚠️ السبام (${spam.length}):\n`;
          spam.forEach((t, i) => text += `${i+1}. ${t.threadName || t.threadID}\n   🔑 ${t.threadID}\n\n`);
        }
      }

      text += `└────────────────────────┘`;
      if (info?.messageID) api.unsendMessage(info.messageID);
      api.sendMessage(text, threadID, messageID);
    } catch(e) {
      if (info?.messageID) api.unsendMessage(info.messageID);
      api.sendMessage("❌ تعذر جلب القروبات المعلقة\n" + e.message, threadID, messageID);
    }
  });
};