module.exports.config = {
  name: "uptime",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "FANG",
  description: "عرض معلومات شاملة عن البوت والسيرفر",
  commandCategory: "معلومات",
  usages: "uptime",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  const os = require("os");
  const moment = require("moment-timezone");
  const pingStart = Date.now();

  // Uptime
  const totalSec = Math.floor(process.uptime());
  const days  = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins  = Math.floor((totalSec % 3600) / 60);
  const secs  = totalSec % 60;
  const uptimeStr = `${days}ي ${hours}س ${mins}د ${secs}ث`;

  // Memory
  const mem = process.memoryUsage();
  const ramUsed  = (mem.heapUsed  / 1024 / 1024).toFixed(1);
  const ramTotal = (mem.heapTotal / 1024 / 1024).toFixed(1);
  const sysTotal = (os.totalmem() / 1024 / 1024).toFixed(0);
  const sysFree  = (os.freemem()  / 1024 / 1024).toFixed(0);
  const sysUsed  = (sysTotal - sysFree).toFixed(0);
  const ramBar   = Math.round((sysUsed / sysTotal) * 10);
  const ramBarStr = "█".repeat(ramBar) + "░".repeat(10 - ramBar);

  // CPU
  const cpus     = os.cpus();
  const cpuModel = cpus[0]?.model?.split("@")[0]?.trim() || "غير معروف";
  const cpuCores = cpus.length;

  // Storage (estimate)
  const fs = require("fs");
  let diskInfo = "غير متاح";
  try {
    const { execSync } = require("child_process");
    const df = execSync("df -h / | tail -1").toString().trim().split(/\s+/);
    diskInfo = `${df[2]} مستخدم / ${df[1]} الكل (${df[4]})`;
  } catch(e) {}

  // Node.js version
  const nodeVer = process.version;

  // Ping
  const ping = Date.now() - pingStart;

  // Timezone times
  const zones = [
    { name: "السعودية 🇸🇦", tz: "Asia/Riyadh" },
    { name: "مصر      🇪🇬", tz: "Africa/Cairo" },
    { name: "الإمارات 🇦🇪", tz: "Asia/Dubai"  },
    { name: "العراق   🇮🇶", tz: "Asia/Baghdad" },
    { name: "الكويت   🇰🇼", tz: "Asia/Kuwait"  },
    { name: "المغرب   🇲🇦", tz: "Africa/Casablanca" }
  ];
  const timeText = zones.map(z =>
    `  • ${z.name}: ${moment().tz(z.tz).format("hh:mm:ss A")}`
  ).join("\n");

  // OS uptime
  const osTotalSec = Math.floor(os.uptime());
  const osDays = Math.floor(osTotalSec / 86400);
  const osHrs  = Math.floor((osTotalSec % 86400) / 3600);

  const cmdCount   = global.client?.commands?.size || 0;
  const evtCount   = global.client?.events?.size   || 0;
  const groupCount = global.data?.allThreadID?.length || 0;
  const botName    = global.config?.BOTNAME || "FANG";

  const text =
`⚡ ┌──────── ${botName} ────────┐

🤖 معلومات البوت:
  • الأوامر المحملة : ${cmdCount} أمر
  • الأحداث المحملة : ${evtCount} حدث
  • القروبات النشطة : ${groupCount} قروب
  • إصدار Node.js   : ${nodeVer}

⏱ مدة تشغيل البوت:
  • ${uptimeStr}

📡 زمن الاستجابة:
  • ${ping} مللي ثانية ${ping < 300 ? "🟢" : ping < 700 ? "🟡" : "🔴"}

🕐 الوقت الحالي:
${timeText}

💾 ذاكرة العملية:
  • ${ramUsed}MB مستخدم / ${ramTotal}MB المخصص
  • [${ramBarStr}] ${Math.round(sysUsed/sysTotal*100)}%

🖥 السيرفر:
  • الذاكرة: ${sysUsed}MB / ${sysTotal}MB (متاح: ${sysFree}MB)
  • التخزين: ${diskInfo}
  • المعالج : ${cpuModel}
  • الأنوية : ${cpuCores} نواة
  • تشغيل   : ${osDays}ي ${osHrs}س

└────────────────────────────┘`;

  return api.sendMessage(text, threadID, messageID);
};