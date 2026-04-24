const fs = require("fs");
const path = require("path");

const xavierIntervals = global.xavierIntervals || (global.xavierIntervals = new Map());
const msgPath = path.join(__dirname, "cache/xavier_msg.txt");
const dataDir = path.join(__dirname, "data");
const statePath = path.join(dataDir, "xavier_state.json");

const defaultMessage = `𝗔𝘂𝘁𝗼 𝗥𝗲𝗽𝗹𝘆

≮ᚔ𝑲⌯𒁎⃞⃟   𝑺⌯𒁎⃞⃟   𝑴⌯ᚔ≯
⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁
≮ᚔ𝑲⌯𒁎⃞⃟   𝑺⌯𒁎⃞⃟   𝑴⌯ᚔ≯
⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁
≮ᚔ𝑲⌯𒁎⃞⃟   𝑺⌯𒁎⃞⃟   𝑴⌯ᚔ≯


⌯               .  ⦓🕷️⦔  .              ⌯


➢︱ 𝑿𝑨𝑽𝑰𝑬𝑹 ᚔ 𝑨𝑳𝑶𝑵𝑬 𝑨𝑮𝑨𝑰𝑵𝑺𝑻 𝑨𝑳𝑳 ︱⚕

⥃🏳️⥂                                      ⌯

⋯⌁⟖ 𝑮𝑼𝑨𝑹𝑨𝑵𝑻𝑬𝑬𝑫 ⃞⃟𝑾𝑰𝑻𝑯 𝑴𝒀 𝑷𝑹𝑬𝑺𝑬𝑵𝑪𝑬 ❞ ⟕⌁⋯

⌯                                    ⥃🗞️⥂


⧺   ᚜𝑳𝑬𝑨𝑫𝑬𝑹᚛ᚘ᚜𝑿𝑨𝑽𝑰𝑬𝑹᚛   ⧺`;

function getMessage() {
  try {
    if (fs.existsSync(msgPath)) {
      const data = fs.readFileSync(msgPath, "utf8");
      if (data && data.trim().length > 0) return data;
    }
  } catch (e) {}
  return defaultMessage;
}

function loadState() {
  try {
    if (!fs.existsSync(statePath)) return {};
    const raw = fs.readFileSync(statePath, "utf8");
    return JSON.parse(raw || "{}");
  } catch (e) {
    return {};
  }
}

function saveState(state) {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (e) {
    console.log("[XAVIER] فشل حفظ الحالة: " + e.message);
  }
}

function safeSend(api, message, threadID) {
  try {
    api.sendMessage(message, threadID, (err) => {
      if (err) console.log(`[XAVIER] فشل الإرسال إلى ${threadID}: ${err.error || err.message || err}`);
    });
  } catch (e) {
    console.log(`[XAVIER] خطأ في الإرسال: ${e.message}`);
  }
}

function startInterval(api, threadID, ms) {
  if (xavierIntervals.has(threadID)) {
    clearInterval(xavierIntervals.get(threadID));
    xavierIntervals.delete(threadID);
  }
  const interval = setInterval(() => {
    if (!xavierIntervals.has(threadID)) return;
    safeSend(api, getMessage(), threadID);
  }, ms);
  xavierIntervals.set(threadID, interval);
}

function persistEnable(threadID, ms) {
  const state = loadState();
  state[threadID] = { ms, since: Date.now() };
  saveState(state);
}

function persistDisable(threadID) {
  const state = loadState();
  delete state[threadID];
  saveState(state);
}

module.exports.config = {
  name: "توسيع",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "Auto Reply 24/7 - يستمر حتى بعد إعادة تشغيل البوت",
  commandCategory: "أوامر",
  usages: "تفعيل توسيع | كسر التوسيع",
  cooldowns: 0
};

module.exports.onLoad = function({ api }) {
  try {
    const state = loadState();
    const threads = Object.keys(state);
    if (threads.length === 0) return;
    console.log(`[XAVIER] استئناف Auto Reply في ${threads.length} كروب...`);
    for (const threadID of threads) {
      const entry = state[threadID];
      const ms = (entry && parseInt(entry.ms) >= 1000) ? parseInt(entry.ms) : 30000;
      startInterval(api, threadID, ms);
    }
  } catch (e) {
    console.log("[XAVIER] فشل onLoad: " + e.message);
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const body = (args || []).join(" ").trim();

  if (body === "كسر التوسيع" || (args[0] === "كسر" && args[1] === "التوسيع")) {
    if (xavierIntervals.has(threadID)) {
      clearInterval(xavierIntervals.get(threadID));
      xavierIntervals.delete(threadID);
      persistDisable(threadID);
      return api.sendMessage("✅ تم إيقاف Auto Reply", threadID, messageID);
    }
    return api.sendMessage("Auto Reply مو شغال أصلاً", threadID, messageID);
  }

  const ms = (parseInt(global.config && global.config.xavierInterval) >= 1000) ? parseInt(global.config.xavierInterval) : 30000;
  safeSend(api, getMessage(), threadID);
  startInterval(api, threadID, ms);
  persistEnable(threadID, ms);

  return api.sendMessage(`✅ تم تفعيل Auto Reply 24/7\nسيتم إرسال الرسالة كل ${ms/1000} ثانية\nيستمر تلقائياً حتى بعد إعادة التشغيل\nللإيقاف: كسر التوسيع`, threadID, messageID);
};

module.exports.handleEvent = async function({ api, event }) {
  if (!event.body) return;
  const body = event.body.trim();
  const { threadID } = event;

  if (body === "تفعيل توسيع") {
    const ms = (parseInt(global.config && global.config.xavierInterval) >= 1000) ? parseInt(global.config.xavierInterval) : 30000;
    safeSend(api, getMessage(), threadID);
    startInterval(api, threadID, ms);
    persistEnable(threadID, ms);
  }

  if (body.includes("كسر") && body.includes("التوسيع")) {
    if (xavierIntervals.has(threadID)) {
      clearInterval(xavierIntervals.get(threadID));
      xavierIntervals.delete(threadID);
      persistDisable(threadID);
      api.sendMessage("✅ تم إيقاف Auto Reply", threadID);
    } else {
      api.sendMessage("⚠️ Auto Reply مو شغال أصلاً", threadID);
    }
  }
};
