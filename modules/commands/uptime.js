module.exports.config = {
  name: "uptime",
  version: "6.0.0",
  hasPermssion: 0,
  credits: "FANG",
  description: "معلومات البوت والسيرفر",
  commandCategory: "معلومات",
  usages: "uptime",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  const os     = require("os");
  const moment = require("moment-timezone");
  const start  = Date.now();

  // وقت التشغيل
  const tot = Math.floor(process.uptime());
  const d = Math.floor(tot / 86400);
  const h = Math.floor((tot % 86400) / 3600);
  const m = Math.floor((tot % 3600) / 60);
  const s = tot % 60;
  const runtime = `${d}ي ${h}س ${m}د ${s}ث`;

  // ذاكرة العملية
  const mem       = process.memoryUsage();
  const heapUsed  = (mem.heapUsed  / 1024 / 1024).toFixed(1);
  const heapTotal = (mem.heapTotal / 1024 / 1024).toFixed(1);
  const rss       = (mem.rss       / 1024 / 1024).toFixed(1);

  // المعالج
  const cpus  = os.cpus();
  const cpu   = (cpus[0]?.model || "?").replace(/\(.*?\)/g, "").trim().slice(0, 30);
  const cores = cpus.length;

  // وقت تشغيل الجهاز
  const osSec = Math.floor(os.uptime());
  const osDay = Math.floor(osSec / 86400);
  const osHr  = Math.floor((osSec % 86400) / 3600);

  // ping
  const ms = Date.now() - start;

  // التوقيت
  const zones = [
    ["🇸🇦 السعودية", "Asia/Riyadh"],
    ["🇪🇬 مصر      ", "Africa/Cairo"],
    ["🇦🇪 الإمارات ", "Asia/Dubai"],
    ["🇩🇿 الجزائر  ", "Africa/Algiers"],
    ["🇲🇦 المغرب   ", "Africa/Casablanca"],
  ];
  const times = zones.map(([name, tz]) =>
    `  ${name} — ${moment().tz(tz).format("hh:mm A")}`
  ).join("\n");

  const cmds   = global.client?.commands?.size  || 0;
  const groups = global.data?.allThreadID?.length || 0;
  const botName = global.config?.BOTNAME || "FANG";

  const text = [
    `╔══ ${botName} ══╗`,
    ``,
    `⏱ وقت التشغيل`,
    `  ${runtime}`,
    ``,
    `⚡ الاستجابة — ${ms}ms`,
    ``,
    `🕐 الوقت الحالي`,
    times,
    ``,
    `💾 الذاكرة`,
    `  مستخدم : ${heapUsed} MB`,
    `  إجمالي : ${rss} MB`,
    ``,
    `📊 إحصائيات`,
    `  الأوامر  : ${cmds} أمر`,
    `  القروبات : ${groups} قروب`,
    ``,
    `🖥 السيرفر`,
    `  معالج  : ${cpu}`,
    `  أنوية  : ${cores}`,
    `  يعمل   : ${osDay}ي ${osHr}س`,
    ``,
    `╚${"═".repeat((`╔══ ${botName} ══╗`).length - 2)}╝`,
  ].join("\n");

  return api.sendMessage(text, threadID, messageID);
};
