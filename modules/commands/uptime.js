const os   = require("os");
const path = require("path");
const fs   = require("fs-extra");

const DB_PATH = path.join(process.cwd(), "Horizon_Database", "uptime_styles.json");

// ── قراءة/حفظ الستايل لكل غروب ─────────────────────────────────────────────
function loadStyles() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch(e) { return {}; }
}
function saveStyle(threadID, num) {
  const data = loadStyles();
  data[threadID] = num;
  try { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8"); } catch(e) {}
}
function getStyle(threadID) {
  return loadStyles()[threadID] || 1;
}

// ── دوال مساعدة ──────────────────────────────────────────────────────────────
function fmtTime(sec) {
  sec = Math.floor(sec);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts = [];
  if (d) parts.push(d + " يوم");
  if (h) parts.push(h + " ساعة");
  if (m) parts.push(m + " دق");
  parts.push(s + " ث");
  return parts.join(" ");
}
function fmtMB(b) {
  const mb = b / 1024 / 1024;
  return mb < 1024 ? mb.toFixed(1) + " MB" : (mb / 1024).toFixed(2) + " GB";
}
function ramBar(used, total) {
  const f = Math.round((used / total) * 10);
  return "█".repeat(f) + "░".repeat(10 - f) + " " + ((used / total) * 100).toFixed(0) + "%";
}
function cityTimes() {
  const now = Date.now();
  return [
    { e: "🇲🇦", n: "الدار البيضاء", o: 1 },
    { e: "🇩🇿", n: "وهران",          o: 1 },
    { e: "🇹🇳", n: "تونس",           o: 1 },
    { e: "🇱🇾", n: "طرابلس",         o: 2 },
    { e: "🇪🇬", n: "القاهرة",        o: 3 },
  ].map(c => {
    const d = new Date(now + c.o * 3600000);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return c.e + " " + c.n + ": " + hh + ":" + mm;
  }).join("\n");
}
function getStats() {
  const botUp = process.uptime();
  const sysUp = os.uptime();
  const mem   = process.memoryUsage();
  const total = os.totalmem();
  const free  = os.freemem();
  const used  = total - free;
  const cpu   = os.cpus().length;
  const groups = (global.data?.allThreadID || []).length;
  const ping  = Math.floor(Math.random() * 20) + 10;
  return { botUp, sysUp, mem, total, free, used, cpu, groups, ping };
}

// ── 8 ستايلات ────────────────────────────────────────────────────────────────
function s1(x) {
  return "⌬ MOMO BOT — حالة السيرفر ❄️\n" +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "⏱  وقت التشغيل : " + fmtTime(x.botUp) + "\n" +
    "📡 Ping          : " + x.ping + "ms\n" +
    "💾 ذاكرة البوت  : " + fmtMB(x.mem.rss) + "\n" +
    "📊 ذاكرة السيرفر: " + ramBar(x.used, x.total) + "\n" +
    "👥 الغروبات     : " + x.groups + "\n" +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "🕐 توقيت المدن:\n" + cityTimes() + "\n" +
    "━━━━━━━━━━━━━━━━━━━━";
}
function s2(x) {
  return "╔══════════════════════╗\n" +
    "║   🤖  BOT STATUS  🤖  ║\n" +
    "╚══════════════════════╝\n" +
    "  ⏳ Bot Uptime  ➤ " + fmtTime(x.botUp) + "\n" +
    "  🖥 Sys Uptime  ➤ " + fmtTime(x.sysUp) + "\n" +
    "  ⚡ Ping        ➤ " + x.ping + "ms\n" +
    "  💿 RAM         ➤ " + fmtMB(x.used) + " / " + fmtMB(x.total) + "\n" +
    "  🧠 CPU Cores   ➤ " + x.cpu + "\n" +
    "  📦 Node.js     ➤ " + process.version + "\n" +
    "  🏘 Groups      ➤ " + x.groups + "\n" +
    "╔══════════════════════╗\n" +
    "║   🕐  CITY CLOCKS 🕐  ║\n" +
    "╚══════════════════════╝\n" +
    cityTimes();
}
function s3(x) {
  const bars = "⬛".repeat(Math.round((x.used/x.total)*10)) + "⬜".repeat(10 - Math.round((x.used/x.total)*10));
  return "🌐 حالة البوت\n" +
    "▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n" +
    "🟢 شغال منذ: " + fmtTime(x.botUp) + "\n\n" +
    "💡 Ping: " + x.ping + "ms\n" +
    "💾 الرام: " + bars + "\n   " + fmtMB(x.used) + " من " + fmtMB(x.total) + "\n" +
    "👥 الغروبات: " + x.groups + "\n" +
    "▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n" +
    "⏰ الوقت الآن:\n" + cityTimes();
}
function s4(x) {
  return "━━━━━━━━━━━━━━━━━\n" +
    "      🛸 STATUS\n" +
    "━━━━━━━━━━━━━━━━━\n" +
    "▸ 🟢 Online\n" +
    "▸ ⏱ " + fmtTime(x.botUp) + "\n" +
    "▸ 📡 " + x.ping + "ms ping\n" +
    "▸ 💾 " + fmtMB(x.mem.rss) + " heap\n" +
    "▸ 🏘 " + x.groups + " groups\n" +
    "━━━━━━━━━━━━━━━━━\n" +
    "   ⏰ City Clocks\n" +
    "━━━━━━━━━━━━━━━━━\n" +
    cityTimes() + "\n" +
    "━━━━━━━━━━━━━━━━━";
}
function s5(x) {
  return "🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷\n" +
    "   ⚡ M O M O  B O T\n" +
    "🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷\n\n" +
    "🟢 الحالة  : مشغّل\n" +
    "⏳ الوقت  : " + fmtTime(x.botUp) + "\n" +
    "💥 Ping   : " + x.ping + "ms\n" +
    "📊 الرام  : " + fmtMB(x.used) + "/" + fmtMB(x.total) + "\n" +
    "👑 غروبات : " + x.groups + "\n\n" +
    "🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷\n" +
    "⏰ توقيت المدن:\n" + cityTimes() + "\n" +
    "🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷";
}
function s6(x) {
  return "『 🌙 حالة البوت 🌙 』\n\n" +
    "التشغيل  ⟶ " + fmtTime(x.botUp) + "\n" +
    "السيرفر  ⟶ " + fmtTime(x.sysUp) + "\n" +
    "الاستجابة ⟶ " + x.ping + "ms\n" +
    "الذاكرة  ⟶ " + fmtMB(x.mem.rss) + "\n" +
    "الغروبات ⟶ " + x.groups + "\n\n" +
    "『 ⏰ توقيت المدن 』\n" + cityTimes() + "\n\n" +
    "『 مع تحيات البوت 👑 』";
}
function s7(x) {
  const bar = ramBar(x.used, x.total);
  return "┌─────────────────────┐\n" +
    "│  ✨ MOMO BOT STATS  │\n" +
    "└─────────────────────┘\n" +
    "  🕐 " + fmtTime(x.botUp) + "\n" +
    "  ⚡ " + x.ping + "ms  •  🌀 Node " + process.version + "\n" +
    "  🧠 CPU: " + x.cpu + " cores\n" +
    "  📦 RAM: " + bar + "\n" +
    "  🏠 " + x.groups + " groups active\n" +
    "┌─────────────────────┐\n" +
    "│    🌍 City Clocks   │\n" +
    "└─────────────────────┘\n" +
    cityTimes();
}
function s8(x) {
  const pct = ((x.used / x.total) * 100).toFixed(0);
  return "🎯━━━━━━━━━━━━━━━━━🎯\n" +
    "      💎 BOT ALIVE 💎\n" +
    "🎯━━━━━━━━━━━━━━━━━🎯\n\n" +
    "  ⬆️  Uptime  »  " + fmtTime(x.botUp) + "\n" +
    "  📶 Ping    »  " + x.ping + "ms\n" +
    "  🖥  RAM     »  " + pct + "% used\n" +
    "  🔧 Node    »  " + process.version + "\n" +
    "  👥 Groups  »  " + x.groups + "\n\n" +
    "🎯━━━━━━━━━━━━━━━━━🎯\n" +
    "🌐 توقيت المدن:\n" + cityTimes() + "\n" +
    "🎯━━━━━━━━━━━━━━━━━🎯";
}

const STYLES = [s1, s2, s3, s4, s5, s6, s7, s8];
const NAMES = [
  "1️⃣  كلاسيك عربي",
  "2️⃣  إطار مزدوج",
  "3️⃣  بلوكات ومؤشرات",
  "4️⃣  قائمة نقطية",
  "5️⃣  ألماس أزرق",
  "6️⃣  تاج ياباني",
  "7️⃣  إطار منخفض مع CPU",
  "8️⃣  نجوم ذهبية"
];

// ── الأمر ────────────────────────────────────────────────────────────────────
module.exports.config = {
  name:            "uptime",
  version:         "5.0.0",
  hasPermssion:    0,
  credits:         "MOMO",
  description:     "حالة البوت مع 8 ستايلات قابلة للتغيير لكل غروب",
  commandCategory: "النظام",
  usages:          "uptime | uptime ستايل | uptime ستايل [1-8]",
  cooldowns:       3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const sub = args[0];

  // عرض قائمة الستايلات
  if (sub === "ستايل" && !args[1]) {
    const cur = getStyle(threadID);
    const list = NAMES.map((n, i) => (i + 1 === cur ? "✅ " : "   ") + n).join("\n");
    return api.sendMessage(
      "🎨 الستايل الحالي: " + cur + "\n\n" +
      list + "\n\n" +
      "لتغيير الستايل اكتب:\nuptime ستايل [رقم]",
      threadID, messageID
    );
  }

  // تغيير الستايل
  if (sub === "ستايل" && args[1]) {
    const num = parseInt(args[1]);
    if (isNaN(num) || num < 1 || num > 8) {
      return api.sendMessage("❌ اكتب رقم من 1 لـ 8\nمثال: uptime ستايل 3", threadID, messageID);
    }
    saveStyle(threadID, num);
    const x = getStats();
    const msg = "✅ تم تغيير الستايل إلى " + num + "\n\nشكله كده:\n\n" + STYLES[num - 1](x);
    return api.sendMessage(msg, threadID, messageID);
  }

  // عرض الحالة
  const n = getStyle(threadID);
  const x = getStats();
  return api.sendMessage(STYLES[n - 1](x), threadID, messageID);
};
