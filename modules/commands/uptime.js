const os = require("os");

// حفظ اختيار الستايل لكل غروب
const uptimeStyle = global.uptimeStyle || (global.uptimeStyle = new Map());

module.exports.config = {
  name: "uptime",
  version: "3.0.0",
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
  if (d) p.push(`${d} يوم`);
  if (h) p.push(`${h} ساعة`);
  if (m) p.push(`${m} دق`);
  p.push(`${s} ث`);
  return p.join(" ");
}

function fmtBytes(b) {
  const mb = b / (1024 * 1024);
  return mb < 1024 ? `${mb.toFixed(1)} MB` : `${(mb / 1024).toFixed(2)} GB`;
}

function memBar(used, total) {
  const pct = used / total;
  const filled = Math.round(pct * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled) + ` ${(pct * 100).toFixed(0)}%`;
}

function getCityTimes() {
  const cities = [
    { name: "🇲🇦 الدار البيضاء", tz: "Africa/Casablanca" },
    { name: "🇩🇿 وهران",          tz: "Africa/Algiers"   },
    { name: "🇹🇳 تونس",           tz: "Africa/Tunis"     },
    { name: "🇱🇾 طرابلس",         tz: "Africa/Tripoli"   },
    { name: "🇪🇬 القاهرة",        tz: "Africa/Cairo"     },
  ];
  return cities.map(c => {
    const t = new Date().toLocaleTimeString("ar-SA", { timeZone: c.tz, hour: "2-digit", minute: "2-digit" });
    return `${c.name}: ${t}`;
  }).join("\n");
}

function getStats(ping) {
  const botUp  = process.uptime();
  const sysUp  = os.uptime();
  const mem    = process.memoryUsage();
  const total  = os.totalmem();
  const free   = os.freemem();
  const used   = total - free;
  const cpus   = os.cpus();
  const load   = os.loadavg();
  const groups = (global.data?.allThreadID || []).length;
  return { botUp, sysUp, mem, total, free, used, cpus, load, groups, ping };
}

// ── الأشكال الستة ─────────────────────────────────────────────────────────

function style1(s) {
  return (
`⌬ 𝗭𝗶𝗻𝗼 𝗕𝗼𝘁 — حالة السيرفر ❄️
━━━━━━━━━━━━━━━━━━━
⏱  وقت التشغيل : ${fmtDuration(s.botUp)}
📡 Ping          : ${s.ping}ms
💾 ذاكرة البوت  : ${fmtBytes(s.mem.rss)}
📊 ذاكرة السيرفر: ${memBar(s.used, s.total)}
👥 الغروبات     : ${s.groups}
━━━━━━━━━━━━━━━━━━━
🕐 توقيت المدن:
${getCityTimes()}
━━━━━━━━━━━━━━━━━━━`
  );
}

function style2(s) {
  return (
`╔══════════════════════╗
║   🤖 BOT STATUS 🤖   ║
╚══════════════════════╝
  ⏳ Bot Uptime  ➤ ${fmtDuration(s.botUp)}
  🖥 Sys Uptime  ➤ ${fmtDuration(s.sysUp)}
  ⚡ Ping        ➤ ${s.ping}ms
  💿 RAM         ➤ ${fmtBytes(s.used)} / ${fmtBytes(s.total)}
  🧠 CPU Cores   ➤ ${s.cpus.length}
  📦 Node.js     ➤ ${process.version}
  🏘 Groups      ➤ ${s.groups}
╔══════════════════════╗
║   🕐 CITY CLOCKS 🕐  ║
╚══════════════════════╝
${getCityTimes()}`
  );
}

function style3(s) {
  const bars = `${"⬛".repeat(Math.round((s.used/s.total)*10))}${"⬜".repeat(10-Math.round((s.used/s.total)*10))}`;
  return (
`🌐 حالة البوت
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
🟢 البوت شغال منذ
   ${fmtDuration(s.botUp)}

💡 الـ Ping: ${s.ping}ms
💾 الرام: ${bars}
   ${fmtBytes(s.used)} من ${fmtBytes(s.total)}
👥 عدد الغروبات: ${s.groups}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
⏰ الوقت الآن:
${getCityTimes()}`
  );
}

function style4(s) {
  return (
`━━━━━━━━━━━━━━━━━
      🛸 STATUS
━━━━━━━━━━━━━━━━━
▸ 🟢 Online
▸ ⏱ ${fmtDuration(s.botUp)}
▸ 📡 ${s.ping}ms ping
▸ 💾 ${fmtBytes(s.mem.rss)} heap
▸ 🏘 ${s.groups} groups
━━━━━━━━━━━━━━━━━
   ⏰ City Clocks
━━━━━━━━━━━━━━━━━
${getCityTimes()}
━━━━━━━━━━━━━━━━━`
  );
}

function style5(s) {
  const upPct = Math.min(100, (s.botUp / (s.sysUp || 1)) * 100).toFixed(1);
  return (
`🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷
  ⚡ Z I N O  B O T
🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷

🟢 الحالة    : مشغّل
⏳ الوقت    : ${fmtDuration(s.botUp)}
🔁 Uptime   : ${upPct}%
💥 Ping     : ${s.ping}ms
📊 الرام    : ${fmtBytes(s.used)}/${fmtBytes(s.total)}
👑 الغروبات : ${s.groups}

🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷
⏰ توقيت المدن:
${getCityTimes()}
🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷`
  );
}

function style6(s) {
  return (
`『 🌙 حالة البوت 🌙 』

الوقت التشغيل ⟶ ${fmtDuration(s.botUp)}
السيرفر       ⟶ ${fmtDuration(s.sysUp)}
الاستجابة    ⟶ ${s.ping}ms
الذاكرة      ⟶ ${fmtBytes(s.mem.rss)}
الغروبات      ⟶ ${s.groups}

『 ⏰ توقيت المدن 』
${getCityTimes()}

『 مع تحيات المطور 👑 』`
  );
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

  // uptime ستايل [1-6]
  if (args[0] === "ستايل") {
    const num = parseInt(args[1]);
    if (!num || num < 1 || num > 6) {
      const preview = styleNames.map(s => `• ${s}`).join("\n");
      return api.sendMessage(
        `🎨 اختر شكل عرض الـ uptime:\n\n${preview}\n\nمثال: uptime ستايل 3`,
        threadID, messageID
      );
    }
    uptimeStyle.set(threadID, num);
    return api.sendMessage(`✅ تم اختيار الستايل ${num} — اكتب uptime لترى النتيجة`, threadID, messageID);
  }

  const t1   = Date.now();
  const ping = Date.now() - t1 + 1;
  const s    = getStats(ping);

  const styleNum = uptimeStyle.get(threadID) || 1;
  const fn = styles[styleNum - 1] || styles[0];

  return api.sendMessage(fn(s), threadID, messageID);
};
