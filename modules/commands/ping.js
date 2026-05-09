module.exports.config = {
  name: 'بينق',
  version: '2.0.0',
  hasPermssion: 0,
  credits: 'MOMO',
  description: 'قياس سرعة استجابة البوت',
  commandCategory: 'النظام',
  usages: 'بينق',
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  const start = Date.now();
  api.sendMessage('🏓 جاري القياس...', threadID, messageID);
  const ms = Date.now() - start;
  const uptime = Math.floor(process.uptime());
  const d = Math.floor(uptime / 86400);
  const h = Math.floor((uptime % 86400) / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = uptime % 60;
  const uptimeStr = (d?d+' يوم ':'')+h+'س '+m+'د '+s+'ث';
  const mem = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
  return api.sendMessage(
    '✅ البوت شغال\n' +
    '⚡ الاستجابة: '+ms+'ms\n' +
    '⏱ وقت التشغيل: '+uptimeStr+'\n' +
    '💾 الذاكرة: '+mem+' MB',
    threadID
  );
};
