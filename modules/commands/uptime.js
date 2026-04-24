const os = require("os");

module.exports.config = {
  name: "uptime",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "عرض حالة البوت والسيرفر",
  commandCategory: "أوامر",
  usages: "uptime",
  cooldowns: 0
};

function fmtDuration(sec) {
  sec = Math.floor(sec);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  let parts = [];
  if (d) parts.push(`${d}ي`);
  if (h) parts.push(`${h}س`);
  if (m) parts.push(`${m}د`);
  parts.push(`${s}ث`);
  return parts.join(" ");
}

function fmtBytes(b) {
  const mb = b / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  const t1 = Date.now();
  const botUp = process.uptime();
  const sysUp = os.uptime();
  const mem = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = ((usedMem / totalMem) * 100).toFixed(1);
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  const ping = Date.now() - t1;

  const text =
    `🤖 حالة البوت والسيرفر\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `⏱ تشغيل البوت: ${fmtDuration(botUp)}\n` +
    `🖥 تشغيل السيرفر: ${fmtDuration(sysUp)}\n` +
    `📡 Ping: ${ping}ms\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `💾 ذاكرة البوت: ${fmtBytes(mem.rss)}\n` +
    `📊 ذاكرة السيرفر: ${fmtBytes(usedMem)} / ${fmtBytes(totalMem)} (${memPercent}%)\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `⚙️ المعالج: ${cpus[0].model.split("@")[0].trim()}\n` +
    `🧠 عدد الأنوية: ${cpus.length}\n` +
    `📈 الحمل: ${loadAvg.map(l => l.toFixed(2)).join(" / ")}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `🐧 النظام: ${os.platform()} ${os.arch()}\n` +
    `📦 Node: ${process.version}\n` +
    `👥 عدد القروبات: ${(global.data?.allThreadID || []).length}`;

  return api.sendMessage(text, threadID, messageID);
};
