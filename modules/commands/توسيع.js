const fs   = require("fs");
const path = require("path");

const dataPath        = path.join(process.cwd(), "modules/commands/data/tawsi3.json");
const DEFAULT_TIMEOUT = 30;

// ── حفظ وقراءة ────────────────────────────────────────────────────────────────
function loadData() {
  try { return JSON.parse(fs.readFileSync(dataPath, "utf8")); }
  catch(e) { return {}; }
}
function saveData(obj) {
  try {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(obj, null, 2));
  } catch(e) {}
}
function getConfig(threadID) {
  return loadData()[threadID] || null;
}
function setConfig(threadID, cfg) {
  const data = loadData();
  data[threadID] = cfg;
  saveData(data);
}

// ── Runtime (طابور في الذاكرة فقط) ───────────────────────────────────────────
function ensureRuntime(threadID) {
  if (!global.tawsi3Runtime)             global.tawsi3Runtime = {};
  if (!global.tawsi3Runtime[threadID])   global.tawsi3Runtime[threadID] = { queue: [], processing: false, timer: null };
  return global.tawsi3Runtime[threadID];
}

// ── المعالج: ينتظر أولاً ثم يرسل ─────────────────────────────────────────────
function processQueue(api, threadID) {
  const rt = ensureRuntime(threadID);
  if (rt.processing) return;            // معالج آخر شغّال
  if (rt.queue.length === 0) return;    // لا شيء في الطابور

  const cfg = getConfig(threadID);
  if (!cfg?.active) return;

  rt.processing = true;
  const delay = (cfg.timeout || DEFAULT_TIMEOUT) * 1000;

  // انتظر المدة المحددة أولاً — ثم أرسل
  rt.timer = setTimeout(async () => {
    rt.timer = null;

    const c = getConfig(threadID);
    if (!c?.active) { rt.processing = false; return; }

    // أرسل رسالة واحدة لكل عنصر منتظر في الطابور
    const count = rt.queue.length;
    rt.queue = [];  // فرّغ الطابور قبل الإرسال

    for (let i = 0; i < count; i++) {
      try {
        await new Promise((resolve, reject) =>
          api.sendMessage(c.msg || "", threadID, err => err ? reject(err) : resolve())
        );
      } catch(e) {}
      // توقف قصير بين الرسائل المتعددة لتفادي الحظر
      if (i < count - 1) await new Promise(r => setTimeout(r, 800));
    }

    rt.processing = false;

    // لو وصلت رسائل جديدة أثناء الإرسال → ابدأ دورة جديدة
    const c2 = getConfig(threadID);
    if (c2?.active && rt.queue.length > 0) processQueue(api, threadID);
  }, delay);
}

// Watchdog
let _watchdogStarted = false;
function startWatchdog(api) {
  if (_watchdogStarted) return;
  _watchdogStarted = true;
  setInterval(() => {
    try {
      const data = loadData();
      for (const tid of Object.keys(data)) {
        if (!data[tid]?.active) continue;
        const rt = global.tawsi3Runtime?.[tid];
        if (rt?.queue.length > 0 && !rt.processing) processQueue(api, tid);
      }
    } catch(e) {}
  }, 2 * 60 * 1000);
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports.config = {
  name: "توسيع",
  version: "7.0.0",
  hasPermssion: 3,
  credits: "FANG",
  description: "يرد على رسائل القروب بعد انتظار الوقت المحدد",
  commandCategory: "أدوات",
  usages: "توسيع | توسيع رسالة [نص] | توسيع وقت [ثوانٍ] | توسيع كسر",
  cooldowns: 3
};

module.exports.onLoad = function({ api } = {}) {
  if (!global.tawsi3Runtime) global.tawsi3Runtime = {};
  const data = loadData();
  for (const tid in data) {
    if (!global.tawsi3Runtime[tid])
      global.tawsi3Runtime[tid] = { queue: [], processing: false, timer: null };
  }
  if (api) startWatchdog(api);
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  ensureRuntime(threadID);
  startWatchdog(api);

  const sub = (args[0] || "").trim();

  // ── إيقاف ─────────────────────────────────────────────────────────────────
  if (sub === "كسر") {
    const cfg = getConfig(threadID);
    if (!cfg?.active)
      return api.sendMessage("⚠️ التوسيع غير مفعّل في هذا القروب", threadID, messageID);

    setConfig(threadID, { ...cfg, active: false });

    const rt = global.tawsi3Runtime[threadID];
    if (rt) {
      rt.queue = []; rt.processing = false;
      if (rt.timer) { clearTimeout(rt.timer); rt.timer = null; }
    }
    return api.sendMessage("✅ تم إيقاف التوسيع", threadID, messageID);
  }

  // ── تغيير الرسالة ─────────────────────────────────────────────────────────
  if (sub === "رسالة") {
    const msg = args.slice(1).join(" ").trim();
    if (!msg)
      return api.sendMessage("❌ اكتب الرسالة بعد الأمر\nمثال: توسيع رسالة مرحباً!", threadID, messageID);
    const cfg = getConfig(threadID) || { active: false, msg: "", timeout: DEFAULT_TIMEOUT };
    setConfig(threadID, { ...cfg, msg });
    return api.sendMessage(`✅ تم تحديث الرسالة:\n\n"${msg}"`, threadID, messageID);
  }

  // ── تغيير الوقت ───────────────────────────────────────────────────────────
  if (sub === "وقت") {
    const secs = parseInt(args[1]);
    if (isNaN(secs) || secs < 5 || secs > 3600)
      return api.sendMessage("❌ اكتب وقتاً بين 5 و3600 ثانية\nمثال: توسيع وقت 60", threadID, messageID);
    const cfg = getConfig(threadID) || { active: false, msg: "", timeout: DEFAULT_TIMEOUT };
    setConfig(threadID, { ...cfg, timeout: secs });
    return api.sendMessage(`✅ تم تحديث الوقت إلى ${secs} ثانية`, threadID, messageID);
  }

  // ── مفعّل بالفعل ──────────────────────────────────────────────────────────
  const existingCfg = getConfig(threadID);
  if (existingCfg?.active) {
    return api.sendMessage(
      `⚠️ التوسيع مفعّل بالفعل\n\n` +
      `📢 الرسالة: "${existingCfg.msg || ""}"\n` +
      `⏱️ الانتظار قبل الرد: ${existingCfg.timeout || DEFAULT_TIMEOUT} ثانية`,
      threadID, messageID
    );
  }

  // ── تفعيل ─────────────────────────────────────────────────────────────────
  const base   = existingCfg || { msg: "", timeout: DEFAULT_TIMEOUT };
  const newCfg = { ...base, active: true };
  setConfig(threadID, newCfg);

  const rt = global.tawsi3Runtime[threadID];
  rt.processing = false;
  if (rt.timer) { clearTimeout(rt.timer); rt.timer = null; }

  return api.sendMessage(
    `✅ تم تفعيل التوسيع!\n\n` +
    `📢 الرسالة: "${newCfg.msg || ""}"\n` +
    `⏱️ الانتظار قبل الرد: ${newCfg.timeout || DEFAULT_TIMEOUT} ثانية`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  try {
    const { threadID, senderID, type } = event;
    if (type !== "message" && type !== "message_reply") return;

    let botID;
    try { botID = String(api.getCurrentUserID()); } catch(e) { return; }
    if (String(senderID) === botID) return;

    const cfg = getConfig(threadID);
    if (!cfg?.active) return;

    const rt = ensureRuntime(threadID);
    rt.queue.push({ senderID: String(senderID), ts: Date.now() });

    // ابدأ المعالج فقط إذا لم يكن يعمل (سيُرسل بعد انتهاء الانتظار)
    if (!rt.processing) processQueue(api, threadID);
  } catch(e) {}
};
