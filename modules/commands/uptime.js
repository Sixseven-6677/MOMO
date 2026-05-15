module.exports.config = {
  name: "uptime",
  version: "5.0.0",
  hasPermssion: 0,
  credits: "FANG",
  description: "معلومات البوت والسيرفر",
  commandCategory: "معلومات",
  usages: "uptime",
  cooldowns: 5
};

const boldNum = n => String(Math.floor(Number(n))).split('').map(d => '𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵'[+d] ?? d).join('');

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  const os     = require('os');
  const moment = require('moment-timezone');
  const pingStart = Date.now();

  // وقت تشغيل البوت
  const tot = Math.floor(process.uptime());
  const D   = Math.floor(tot / 86400);
  const H   = Math.floor((tot % 86400) / 3600);
  const M   = Math.floor((tot % 3600) / 60);
  const S   = tot % 60;

  // ذاكرة العملية فقط (دقيقة في containers)
  const mem      = process.memoryUsage();
  const heapUsed  = (mem.heapUsed  / 1024 / 1024).toFixed(0);   // MB
  const heapTotal = (mem.heapTotal / 1024 / 1024).toFixed(0);   // MB
  const rss       = (mem.rss       / 1024 / 1024).toFixed(0);   // MB كل العملية

  // المعالج
  const cpus     = os.cpus();
  const cpuModel = (cpus[0]?.model || 'Unknown')
    .replace(/\(.*?\)/g, '').trim().slice(0, 28);
  const cpuCores = cpus.length;

  // وقت تشغيل النظام
  const osTot = Math.floor(os.uptime());
  const osD   = Math.floor(osTot / 86400);
  const osH   = Math.floor((osTot % 86400) / 3600);

  // ping
  const ms = Date.now() - pingStart;

  // التوقيت
  const zones = [
    { code: '𝗞𝗦𝗔', tz: 'Asia/Riyadh' },
    { code: '𝗘𝗚𝗬', tz: 'Africa/Cairo' },
    { code: '𝗨𝗔𝗘', tz: 'Asia/Dubai' },
    { code: '𝗔𝗟𝗚', tz: 'Africa/Algiers' },
    { code: '𝗠𝗢𝗥', tz: 'Africa/Casablanca' }
  ];

  const bn = boldNum;

  const text =
`⃟─𝗙𝗮𝗻𝗴 〣──

𝗕𝗼𝘁 𝗿𝘂𝗻𝘁𝗶𝗺𝗲:➤
𝗦:${bn(S)}  𝗠:${bn(M)}  𝗛:${bn(H)}  𝗗:${bn(D)} وقت تشغيل البوت
𝗠𝘀/${bn(ms)} سرعة الاستجابة
𝗦𝗲𝗿𝘃𝗲𝗿 𝗺𝗲𝗺𝗼𝗿𝘆
𝗠𝗕${bn(heapUsed)}/${bn(heapTotal)}𝗠𝗕 ذاكرة السيرفر

𝗡𝗼𝘄 𝗧𝗶𝗺𝗲 :

${zones.map(z => `${z.code}/${moment().tz(z.tz).format('hh:mm A')}`).join('\n')}

𝗦𝗲𝗿𝘃𝗲𝗿
𝗠𝗲𝗺𝗼𝗿𝘆 : ${rss}MB / ${heapTotal}MB
𝗣𝗿𝗼𝗰𝗲𝘀𝘀𝗼𝗿 : ${cpuModel}
𝗻𝘂𝗰𝗹𝗲𝗶 : ${bn(cpuCores)}
𝗨𝗽 : ${osD}d ${osH}h`;

  return api.sendMessage(text, threadID, messageID);
};
