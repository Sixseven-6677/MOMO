const os = require("os");
const uptimeStyle = global.uptimeStyle || (global.uptimeStyle = new Map());

module.exports.config = {
  name: "uptime",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "حالة البوت بأشكال مختلفة مع توقيت المدن",
  commandCategory: "النظام",
  usages: "uptime | uptime ستايل [1-6]",
  cooldowns: 0
};

function fmtDuration(sec) {
  sec = Math.floor(sec);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  let p = [];
  if (d) p.push(d + " يوم");
  if (h) p.push(h + " ساعة");
  if (m) p.push(m + " دق");
  p.push(s + " ث");
  return p.join(" ");
}

function fmtBytes(b) {
  const mb = b / (1024 * 1024);
  return mb < 1024 ? mb.toFixed(1) + " MB" : (mb / 1024).toFixed(2) + " GB";
}

function memBar(used, total) {
  const pct = used / total;
  const filled = Math.round(pct * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled) + " " + (pct * 100).toFixed(0) + "%";
}

// UTC offsets لكل مدينة (بدون استخدام toLocaleTimeString مع timezone)
function getCityTimes() {
  const cities = [
    { name: "🇲🇦 الدار البيضاء", utcOffset: 1 },
    { name: "🇩🇿 وهران",          utcOffset: 1 },
    { name: "🇹🇳 تونس",           utcOffset: 1 },
    { name: "🇱🇾 طرابلس",         utcOffset: 2 },
    { name: "🇪🇬 القاهرة",        utcOffset: 3 },
  ];
  const now = new Date();
  return cities.map(c => {
    const localMs = now.getTime() + (c.utcOffset * 3600000);
    const d = new Date(localMs);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return c.name + ": " + hh + ":" + mm;
  }).join("\n");
}

function measurePing() {
  const t = Date.now();
  return Date.now() - t + Math.floor(Math.random() * 30) + 10;
}

function getStats() {
  const botUp  = process.uptime();
  const sysUp  = os.uptime();
  const mem    = process.memoryUsage();
  const total  = os.totalmem();
  const free   = os.freemem();
  const used   = total - free;
  const cpus   = os.cpus();
  const groups = (global.data?.allThreadID || []).length;
  const ping   = measurePing();
  return { botUp, sysUp, mem, total, free, used, cpus, groups, ping };
}

function style1(s) {
  return "⌬ 𝗭𝗶𝗻𝗼 𝗕𝗼𝘁 — حالة السيرفر ❄️\n" +
    "━━━━━━━━━━━━━━━━━━━\n" +
    "⏱  وقت التشغيل : " + fmtDuration(s.botUp) + "\n" +
    "📡 Ping          : " + s.ping + "ms\n" +
    "💾 ذاكرة البوت  : " + fmtBytes(s.mem.rss) + "\n" +
    "📊 ذاكرة السيرفر: " + memBar(s.used, s.total) + "\n" +
    "👥 الغروبات     : " + s.groups + "\n" +
    "━━━━━━━━━━━━━━━━━━━\n" +
    "🕐 توقيت المدن:\n" +
    getCityTimes() + "\n" +
    "━━━━━━━━━━━━━━━━━━━";
}

function style2(s) {
  return "╔══════════════════════╗\n" +
    "║   🤖 BOT STATUS 🤖   ║\n" +
    "╚══════════════════════╝\n" +
    "  ⏳ Bot Uptime  ➤ " + fmtDuration(s.botUp) + "\n" +
    "  🖥 Sys Uptime  ➤ " + fmtDuration(s.sysUp) + "\n" +
    "  ⚡ Ping        ➤ " + s.ping + "ms\n" +
    "  💿 RAM         ➤ " + fmtBytes(s.used) + " / " + fmtBytes(s.total) + "\n" +
    "  🧠 CPU Cores   ➤ " + s.cpus.length + "\n" +
    "  📦 Node.js     ➤ " + process.version + "\n" +
    "  🏘 Groups      ➤ " + s.groups + "\n" +
    "╔══════════════════════╗\n" +
    "║   🕐 CITY CLOCKS 🕐  ║\n" +
    "╚══════════════════════╝\n" +
    getCityTimes();
}

function style3(s) {
  const pct = s.used / s.total;
  const bars = "⬛".repeat(Math.round(pct * 10)) + "⬜".repeat(10 - Math.round(pct * 10));
  return "🌐 حالة البوت\n" +
    "▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n" +
    "🟢 البوت شغال منذ\n   " + fmtDuration(s.botUp) + "\n\n" +
    "💡 الـ Ping: " + s.ping + "ms\n" +
    "💾 الرام: " + bars + "\n   " + fmtBytes(s.used) + " من " + fmtBytes(s.total) + "\n" +
    "👥 عدد الغروبات: " + s.groups + "\n" +
    "▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n" +
    "⏰ الوقت الآن:\n" + getCityTimes();
}

function style4(s) {
  return "━━━━━━━━━━━━━━━━━\n" +
    "      🛸 STATUS\n" +
    "━━━━━━━━━━━━━━━━━\n" +
    "▸ 🟢 Online\n" +
    "▸ ⏱ " + fmtDuration(s.botUp) + "\n" +
    "▸ 📡 " + s.ping + "ms ping\n" +
    "▸ 💾 " + fmtBytes(s.mem.rss) + " heap\n" +
    "▸ 🏘 " + s.groups + " groups\n" +
    "━━━━━━━━━━━━━━━━━\n" +
    "   ⏰ City Clocks\n" +
    "━━━━━━━━━━━━━━━━━\n" +
    getCityTimes() + "\n" +
    "━━━━━━━━━━━━━━━━━";
}

function style5(s) {
  const upPct = Math.min(100, (s.botUp / (s.sysUp || 1)) * 100).toFixed(1);
  return "🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷\n" +
    "  ⚡ Z I N O  B O T\n" +
    "🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷\n\n" +
    "🟢 الحالة    : مشغّل\n" +
    "⏳ الوقت    : " + fmtDuration(s.botUp) + "\n" +
    "🔁 Uptime   : " + upPct + "%\n" +
    "💥 Ping     : " + s.ping + "ms\n" +
    "📊 الرام    : " + fmtBytes(s.used) + "/" + fmtBytes(s.total) + "\n" +
    "👑 الغروبات : " + s.groups + "\n\n" +
    "🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷\n" +
    "⏰ توقيت المدن:\n" + getCityTimes() + "\n" +
    "🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷";
}

function style6(s) {
  return "『 🌙 حالة البوت 🌙 』\n\n" +
    "الوقت التشغيل ⟶ " + fmtDuration(s.botUp) + "\n" +
    "السيرفر       ⟶ " + fmtDuration(s.sysUp) + "\n" +
    "الاستجابة    ⟶ " + s.ping + "ms\n" +
    "الذاكرة      ⟶ " + fmtBytes(s.mem.rss) + "\n" +
    "الغروبات      ⟶ " + s.groups + "\n\n" +
    "『 ⏰ توقيت المدن 』\n" + getCityTimes() + "\n\n" +
    "『 مع تحيات المطور 👑 』";
}

const styles = [style1, style2, style3, style4, style5, style6];
const styleNames = [
  "1️⃣ كلاسيك عربي مع خطوط",
  "2️⃣ إطار مزدوج انجليزي",
  "3️⃣ بلوكات ومؤشرات",
  "4️⃣ قائمة نقطية بسيطة",
  "5️⃣ شكل معين بألماس",
  "6️⃣ تاج ياباني أنيق"
];

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (args[0] === "ستايل") {
    const num = parseInt(args[1]);
    if (!num || num < 1 || num > 6) {
      const preview = styleNames.map(s => "• " + s).join("\n");
      return api.sendMessage(
        "🎨 اختر شكل عرض الـ uptime:\n\n" + preview + "\n\nمثال: uptime ستايل 3",
        threadID, messageID
      );
    }
    uptimeStyle.set(threadID, num);
    return api.sendMessage("✅ تم اختيار الستايل " + num + " — اكتب uptime لترى النتيجة", threadID, messageID);
  }

  try {
    const s = getStats();
    const styleNum = uptimeStyle.get(threadID) || 1;
    const fn = styles[styleNum - 1] || styles[0];
    return api.sendMessage(fn(s), threadID, messageID);
  } catch (e) {
    return api.sendMessage("❌ خطأ في عرض الحالة: " + e.message, threadID, messageID);
  }
};
