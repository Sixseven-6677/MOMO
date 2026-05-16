module.exports.config = {
  name: "uptime",
  version: "8.0.0",
  hasPermssion: 0,
  credits: "FANG",
  description: "صورة داشبورد معلومات البوت",
  commandCategory: "معلومات",
  usages: "uptime",
  cooldowns: 10
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  const os      = require('os');
  const moment  = require('moment-timezone');
  const path    = require('path');
  const fs      = require('fs');
  const pingStart = Date.now();

  // ── uptime حقيقي من أول تشغيل البوت (لا يتأثر بإعادة التشغيل) ──────
  const _startMs = parseInt(process.env.BOT_START_TIME || '0') || (Date.now() - process.uptime() * 1000);
  const tot = Math.floor((Date.now() - _startMs) / 1000);
  const d   = Math.floor(tot / 86400);
  const h   = Math.floor((tot % 86400) / 3600);
  const m   = Math.floor((tot % 3600) / 60);
  const sc  = tot % 60;
  const uptimeStr = [
    d > 0 ? `${d}d` : '',
    h > 0 ? `${h}h` : '',
    m > 0 ? `${m}m` : '',
    `${sc}s`
  ].filter(Boolean).join(' ');

  const mem       = process.memoryUsage();
  const heapUsed  = (mem.heapUsed  / 1024 / 1024).toFixed(1);
  const heapTotal = (mem.heapTotal / 1024 / 1024).toFixed(1);
  const rss       = (mem.rss       / 1024 / 1024).toFixed(1);
  const heapPct   = mem.heapUsed / mem.heapTotal;
  const rssPct    = Math.min(mem.rss / (os.totalmem() || 1), 1);

  const cpus     = os.cpus();
  const cpu      = (cpus[0]?.model || 'Unknown').replace(/\(.*?\)/g, '').trim().slice(0, 30);
  const osSec    = Math.floor(os.uptime());
  const osUptime = `${Math.floor(osSec/86400)}d ${Math.floor((osSec%86400)/3600)}h`;

  const ping = Date.now() - pingStart;

  let diskFree = 'N/A', diskFreePct = 0;
  try {
    const { execSync } = require('child_process');
    const df = execSync('df -k / 2>/dev/null', { encoding: 'utf8', timeout: 3000 });
    const parts = df.trim().split('\n').pop().split(/\s+/);
    if (parts.length >= 4) {
      const total = parseInt(parts[1]) || 1;
      const avail = parseInt(parts[3]) || 0;
      diskFreePct = avail / total;
      diskFree    = (avail / 1024 / 1024).toFixed(1) + ' GB';
    }
  } catch(e) {}

  const currentTime = moment().format('hh:mm:ss A');

  const zones = [
    { flag: 'SA', city: 'Riyadh',     tz: 'Asia/Riyadh'       },
    { flag: 'EG', city: 'Cairo',      tz: 'Africa/Cairo'      },
    { flag: 'AE', city: 'Dubai',      tz: 'Asia/Dubai'        },
    { flag: 'DZ', city: 'Algiers',    tz: 'Africa/Algiers'    },
    { flag: 'MA', city: 'Casablanca', tz: 'Africa/Casablanca' },
  ];
  const times = zones.map(z => ({
    flag: z.flag, city: z.city,
    time: moment().tz(z.tz).format('hh:mm A')
  }));

  const cmds    = global.client?.commands?.size    || 0;
  const groups  = global.data?.allThreadID?.length || 0;
  const events  = (global.client?.recentEvents    || []).slice(0, 7);
  const botName = global.config?.BOTNAME || 'Fang';

  let imgPath;
  try {
    const { makeCard } = require('../../utils/makeCard');
    const buf = await makeCard({
      botName, version: global.config?.version || '1.2.14',
      uptime: uptimeStr, ping: ping + 'ms',
      cmds, groups,
      heapUsed, heapTotal, rss, heapPct, rssPct,
      cpu, osUptime,
      diskFree, diskFreePct,
      currentTime,
      times, events
    });

    imgPath = path.join(os.tmpdir(), `uptime_${Date.now()}.png`);
    fs.writeFileSync(imgPath, buf);

    await new Promise((resolve, reject) => {
      api.sendMessage(
        { attachment: fs.createReadStream(imgPath) },
        threadID,
        (err) => {
          if (imgPath) try { fs.unlinkSync(imgPath); } catch(e) {}
          if (err) reject(err); else resolve();
        },
        messageID
      );
    });
  } catch (err) {
    if (imgPath) try { fs.unlinkSync(imgPath); } catch(e) {}
    const text = [
      `╔══ ${botName} ══╗`,
      `⏱ ${uptimeStr}`,
      `⚡ ${ping}ms`,
      `💾 Heap: ${heapUsed}/${heapTotal} MB`,
      `📊 Cmds: ${cmds}  Groups: ${groups}`,
      `╚${'═'.repeat(10)}╝`,
    ].join('\n');
    return api.sendMessage(text, threadID, messageID);
  }
};
