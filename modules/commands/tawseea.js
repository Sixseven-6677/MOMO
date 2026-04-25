const fs = require("fs");
const path = require("path");

const tawseeaIntervals = global.tawseeaIntervals || (global.tawseeaIntervals = new Map());
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


⌯               .  ⦓🕷️⦔  .              ⌯


➢︱ 𝑻𝑨𝑾𝑺𝑬𝑬𝑨 ᚔ 𝑨𝑳𝑶𝑵𝑬 𝑨𝑮𝑨𝑰𝑵𝑺𝑻 𝑨𝑳𝑳 ︱⚕

⥃🏳️⥂                                      ⌯

⋯⌁⟖ 𝑮𝑼𝑨𝑹𝑨𝑵𝑻𝑬𝑬𝑫 ⃞⃟𝑾𝑰𝑻𝑯 𝑴𝒀 𝑷𝑹𝑬𝑺𝑬𝑵𝑪𝑬 ❞ ⟕⌁⋯

⌯                                    ⥃🗞️⥂


⧺   ᚜𝑳𝑬𝑨𝑫𝑬𝑹᚛ᚘ᚜𝑻𝑨𝑾𝑺𝑬𝑬𝑨᚛   ⧺`;

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
  const ms = parseInt(global.config && global.config.tawseeaInterval);
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

function liveApi() {
  try {
    if (global.client && global.client.api) return global.client.api;
  } catch (e) {}
  return null;
}

function safeSend(threadID) {
  const api = liveApi();
  if (!api) return;
  try {
    api.sendMessage(getMessage(), threadID, () => {});
  } catch (e) {}
}

function startInterval(threadID, ms) {
  ms = ms || getInterval();
  const tid = String(threadID);
  if (tawseeaIntervals.has(tid)) {
    try { clearInterval(tawseeaIntervals.get(tid)); } catch (e) {}
    tawseeaIntervals.delete(tid);
  }
  const interval = setInterval(() => {
    if (!tawseeaIntervals.has(tid)) return;
    safeSend(tid);
  }, ms);
  tawseeaIntervals.set(tid, interval);
}

function ensureRunning(threadID) {
  const tid = String(threadID);
  const state = loadState();
  if (state[tid] && !tawseeaIntervals.has(tid)) {
    startInterval(tid, state[tid].ms);
  }
}

module.exports.config = {
  name: "توسيع",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "تفعيل توسيع: يرسل Auto Reply كل 30 ثانية بشكل دائم 24/7 مع استمرار العمل بعد إعادة تشغيل البوت أو انقطاع الاتصال",
  commandCategory: "أوامر",
  usages: "تفعيل توسيع | كسر التوسيع",
  cooldowns: 0
};

module.exports.onLoad = function() {
  ensureCacheDir();
  try {
    const state = loadState();
    for (const tid of Object.keys(state)) startInterval(tid, state[tid].ms);
  } catch (e) {}

  if (!global.__tawseeaWatchdog) {
    global.__tawseeaWatchdog = setInterval(() => {
      try {
        const state = loadState();
        for (const tid of Object.keys(state)) {
          if (!tawseeaIntervals.has(tid)) startInterval(tid, state[tid].ms);
        }
      } catch (e) {}
    }, 30 * 1000);
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (args[0] === "توقف" || args[0] === "كسر") {
    if (tawseeaIntervals.has(String(threadID))) {
      try { clearInterval(tawseeaIntervals.get(String(threadID))); } catch (e) {}
      tawseeaIntervals.delete(String(threadID));
    }
    setInactive(threadID);
    return api.sendMessage("✅ تم كسر التوسيع — توقف Auto Reply", threadID, messageID);
  }

  const ms = getInterval();
  setActive(threadID, ms);
  startInterval(threadID, ms);
  api.sendMessage(getMessage(), threadID);

  return api.sendMessage(
    `✅ تم تفعيل التوسيع\n⏱ يُرسل كل ${ms/1000} ثانية\n♾ يعمل 24/7 ولن يتوقف حتى لو أعيد تشغيل البوت أو انقطع الاتصال\n⛔ للإيقاف: كسر التوسيع`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ event }) {
  if (!event || !event.threadID) return;
  ensureRunning(event.threadID);

  if (!event.body) return;
  const body = event.body.trim();
  const { threadID } = event;

  const activatePhrases = ["توسيع", "تفعيل توسيع", "خافير"];
  const stopPhrases = ["كسر التوسيع", "توسيع توقف", "خافير توقف", "كسر توسيع"];

  if (stopPhrases.includes(body)) {
    if (tawseeaIntervals.has(String(threadID))) {
      try { clearInterval(tawseeaIntervals.get(String(threadID))); } catch (e) {}
      tawseeaIntervals.delete(String(threadID));
    }
    setInactive(threadID);
    const api = liveApi();
    if (api) api.sendMessage("✅ تم كسر التوسيع — توقف Auto Reply", threadID);
    return;
  }

  if (activatePhrases.includes(body)) {
    const ms = getInterval();
    setActive(threadID, ms);
    startInterval(threadID, ms);
    safeSend(threadID);
  }
};
