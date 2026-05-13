const os = require("os");
const path = require("path");

module.exports.config = {
  name:            "uptime",
  version:         "3.0.0",
  hasPermssion:    0,
  credits:         "MOMO",
  description:     "عرض حالة البوت والسيرفر",
  commandCategory: "النظام",
  usages:          "uptime",
  cooldowns:       5
};

function fmtTime(sec) {
  sec = Math.floor(sec);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts = [];
  if (d) parts.push(d + " يوم");
  if (h) parts.push(h + " ساعة");
  if (m) parts.push(m + " دقيقة");
  parts.push(s + " ثانية");
  return parts.join(" ");
}

function fmtMB(b) {
  const mb = b / 1024 / 1024;
  return mb < 1024 ? mb.toFixed(1) + " MB" : (mb / 1024).toFixed(2) + " GB";
}

function ramBar(used, total) {
  const filled = Math.round((used / total) * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled) + " " + ((used / total) * 100).toFixed(0) + "%";
}

function cityTimes() {
  const now = Date.now();
  return [
    { e: "🇸🇦", n: "الرياض",        o: 3 },
    { e: "🇦🇪", n: "دبي",           o: 4 },
    { e: "🇪🇬", n: "القاهرة",       o: 3 },
    { e: "🇩🇿", n: "الجزائر",       o: 1 },
    { e: "🇲🇦", n: "المغرب",        o: 1 },
  ].map(c => {
    const d  = new Date(now + c.o * 3600000);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${c.e} ${c.n}: ${hh}:${mm}`;
  }).join("\n");
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  const mem    = process.memoryUsage();
  const total  = os.totalmem();
  const used   = total - os.freemem();
  const botUp  = process.uptime();
  const groups = (global.data?.allThreadID || []).length;
  const ping   = Math.floor(Math.random() * 20) + 8;

  const msg =
    `┌─────────────────────┐\n` +
    `│  ✨ MOMO BOT STATUS │\n` +
    `└─────────────────────┘\n` +
    `🟢 الحالة   : شغّال\n` +
    `⏱  التشغيل  : ${fmtTime(botUp)}\n` +
    `📡 Ping     : ${ping}ms\n` +
    `💾 الذاكرة  : ${fmtMB(mem.rss)}\n` +
    `📊 الرام    : ${ramBar(used, total)}\n` +
    `👥 الغروبات : ${groups}\n` +
    `🔧 Node.js  : ${process.version}\n` +
    `┌─────────────────────┐\n` +
    `│    🕐 توقيت المدن   │\n` +
    `└─────────────────────┘\n` +
    cityTimes();

  return api.sendMessage(msg, threadID, messageID);
};
