const fs = require("fs");
const path = require("path");

const xavierIntervals = global.xavierIntervals || (global.xavierIntervals = new Map());
const cacheDir = path.join(__dirname, "cache");
const msgPath = path.join(cacheDir, "xavier_msg.txt");
const statePath = path.join(cacheDir, "xavier_active.json");

const defaultMessage = `𝗔𝘂𝘁𝗼 𝗥𝗲𝗽𝗹𝘆

≮ᚔ𝑲⌯𒁎⃞⃟   𝑺⌯𒁎⃞⃟   𝑴⌯ᚔ≯
⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁
≮ᚔ𝑲⌯𒁎⃞⃟   𝑺⌯𒁎⃞⃟   𝑴⌯ᚔ≯
⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁
≮ᚔ𝑲⌯𒁎⃞⃟   𝑺⌯𒁎⃞⃟   𝑴⌯ᚔ≯
⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁
≮ᚔ𝑲⌯𒁎⃞⃟   𝑺⌯𒁎⃞⃟   𝑴⌯ᚔ≯
⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁
≮ᚔ𝑲⌯𒁎⃞⃟   𝑺⌯𒁎⃞⃟   𝑴⌯ᚔ≯
⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁
≮ᚔ𝑲⌯𒁎⃞⃟   𝑺⌯𒁎⃞⃟   𝑴⌯ᚔ≯
⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁
≮ᚔ𝑲⌯𒁎⃞⃟   𝑺⌯𒁎⃞⃟   𝑴⌯ᚔ≯
⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁
≮ᚔ𝑲⌯𒁎⃞⃟   𝑺⌯𒁎⃞⃟   𝑴⌯ᚔ≯
⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁
≮ᚔ𝑲⌯𒁎⃞⃟   𝑺⌯𒁎⃞⃟   𝑴⌯ᚔ≯
⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁

                       
⌯               .  ⦓🕷️⦔  .              ⌯


➢︱ 𝑿𝑨𝑽𝑰𝑬𝑹 ᚔ 𝑨𝑳𝑶𝑵𝑬 𝑨𝑮𝑨𝑰𝑵𝑺𝑻 𝑨𝑳𝑳 ︱⚕

⥃🏳️⥂                                      ⌯

⋯⌁⟖ 𝑮𝑼𝑨𝑹𝑨𝑵𝑻𝑬𝑬𝑫 ⃞⃟𝑾𝑰𝑻𝑯 𝑴𝒀 𝑷𝑹𝑬𝑺𝑬𝑵𝑪𝑬 ❞ ⟕⌁⋯

⌯                                    ⥃🗞️⥂


⧺   ᚜𝑳𝑬𝑨𝑫𝑬𝑹᚛ᚘ᚜𝑿𝑨𝑽𝑰𝑬𝑹᚛   ⧺`;

function ensureCacheDir() {
  try { if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true }); } catch (e) {}
}

function getMessage() {
  try {
    if (fs.existsSync(msgPath)) return fs.readFileSync(msgPath, "utf8");
  } catch (e) {}
  return defaultMessage;
}

function getInterval() {
  const ms = parseInt(global.config?.xavierInterval);
  if (!isNaN(ms) && ms >= 1000) return ms;
  return 30000;
}

function loadState() {
  try {
    if (fs.existsSync(statePath)) {
      const data = JSON.parse(fs.readFileSync(statePath, "utf8"));
      if (data && typeof data === "object") return data;
    }
  } catch (e) {}
  return {};
}

function saveState(state) {
  try {
    ensureCacheDir();
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf8");
  } catch (e) {}
}

function setActive(threadID, ms) {
  const state = loadState();
  state[String(threadID)] = { ms: ms || getInterval(), startedAt: Date.now() };
  saveState(state);
}

function setInactive(threadID) {
  const state = loadState();
  delete state[String(threadID)];
  saveState(state);
}

function safeSend(api, threadID) {
  try {
    api.sendMessage(getMessage(), threadID, (err) => {
      if (err) {
        // swallow errors so the interval keeps trying
      }
    });
  } catch (e) {
    // ignore — keep ticking
  }
}

function startInterval(api, threadID, ms) {
  ms = ms || getInterval();
  const tid = String(threadID);
  if (xavierIntervals.has(tid)) {
    try { clearInterval(xavierIntervals.get(tid)); } catch (e) {}
    xavierIntervals.delete(tid);
  }
  const interval = setInterval(() => {
    if (!xavierIntervals.has(tid)) return;
    safeSend(api, tid);
  }, ms);
  if (interval && typeof interval.unref !== "function") {
    // node always returns Timeout, just safety
  }
  xavierIntervals.set(tid, interval);
}

function ensureRunning(api, threadID) {
  const tid = String(threadID);
  const state = loadState();
  if (state[tid] && !xavierIntervals.has(tid)) {
    startInterval(api, tid, state[tid].ms);
  }
}

module.exports.config = {
  name: "خافير",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "عند قول خافير يرسل Auto Reply كل 30 ثانية (يعمل بدون توقف)",
  commandCategory: "أوامر",
  usages: "خافير | خافير توقف",
  cooldowns: 0
};

// Restore active auto-replies after bot start / restart
module.exports.onLoad = function({ api }) {
  ensureCacheDir();
  try {
    const state = loadState();
    for (const tid of Object.keys(state)) {
      startInterval(api, tid, state[tid].ms);
    }
  } catch (e) {}

  // Watchdog: every 60s make sure every saved thread is still running
  if (!global.__xavierWatchdog) {
    global.__xavierWatchdog = setInterval(() => {
      try {
        const state = loadState();
        for (const tid of Object.keys(state)) {
          if (!xavierIntervals.has(tid)) {
            startInterval(api, tid, state[tid].ms);
          }
        }
      } catch (e) {}
    }, 60 * 1000);
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (args[0] === "توقف") {
    if (xavierIntervals.has(String(threadID))) {
      try { clearInterval(xavierIntervals.get(String(threadID))); } catch (e) {}
      xavierIntervals.delete(String(threadID));
    }
    setInactive(threadID);
    return api.sendMessage("✅ تم إيقاف Auto Reply", threadID, messageID);
  }

  const ms = getInterval();
  setActive(threadID, ms);
  startInterval(api, threadID, ms);
  api.sendMessage(getMessage(), threadID);

  return api.sendMessage(
    `✅ تم تفعيل Auto Reply\nسيتم إرسال الرسالة كل ${ms/1000} ثانية\nسيستمر العمل حتى لو أعيد تشغيل البوت\nللإيقاف: خافير توقف`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  if (!event || !event.threadID) return;

  // Lazy revival: if the bot just restarted and a message arrives in a thread
  // that should be auto-replying, make sure the interval is running again.
  ensureRunning(api, event.threadID);

  if (!event.body) return;
  const body = event.body.trim();
  const { threadID } = event;

  if (body === "خافير") {
    const ms = getInterval();
    setActive(threadID, ms);
    startInterval(api, threadID, ms);
    safeSend(api, threadID);
  }
};
