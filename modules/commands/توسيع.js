const fs   = require("fs");
const path = require("path");

const dataPath = path.join(process.cwd(), "modules/commands/data/tawsi3.json");
const DEFAULT_TIMEOUT = 30;

function loadData() {
  try { return JSON.parse(fs.readFileSync(dataPath, "utf8")); }
  catch(e) { return {}; }
}
function saveData(obj) {
  try {
    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(obj, null, 2));
  } catch(e) {}
}

function ensureGlobal() {
  if (!global.tawsi3Data)    global.tawsi3Data    = {};
  if (!global.tawsi3Runtime) global.tawsi3Runtime = {};
}

// يحمّل بيانات الـ thread من الملف إذا لم تكن محمّلة في الذاكرة
function ensureThread(threadID) {
  ensureGlobal();
  if (!global.tawsi3Data[threadID]) {
    const saved = loadData();
    if (saved[threadID]) {
      global.tawsi3Data[threadID] = saved[threadID];
    }
  }
  if (!global.tawsi3Runtime[threadID]) {
    global.tawsi3Runtime[threadID] = { queue: [], processing: false, timer: null };
  }
}

// المعالج — يرسل رسالة من الطابور ثم ينتظر المدة المحددة
async function processQueue(api, threadID) {
  const r = global.tawsi3Runtime[threadID];
  const c = global.tawsi3Data[threadID];
  if (!r || !c || !c.active) {
    if (r) r.processing = false;
    return;
  }
  if (r.queue.length === 0) {
    r.processing = false;
    return;
  }

  r.processing = true;
  r.queue.shift();

  try {
    await new Promise((resolve, reject) => {
      api.sendMessage(c.msg || "", threadID, (err) => {
        if (err) reject(err); else resolve();
      });
    });
  } catch(e) {}

  const delay = ((global.tawsi3Data[threadID]?.timeout) || DEFAULT_TIMEOUT) * 1000;

  r.timer = setTimeout(() => {
    r.timer = null;
    const r2 = global.tawsi3Runtime[threadID];
    const c2 = global.tawsi3Data[threadID];
    if (!r2 || !c2 || !c2.active) {
      if (r2) r2.processing = false;
      return;
    }
    r2.processing = false;
    if (r2.queue.length > 0) processQueue(api, threadID);
  }, delay);
}

function startProcessor(api, threadID) {
  ensureThread(threadID);
  const rt  = global.tawsi3Runtime[threadID];
  const cfg = global.tawsi3Data[threadID];
  if (!rt || rt.processing || !cfg?.active || rt.queue.length === 0) return;
  processQueue(api, threadID);
}

// Watchdog: يكشف التوقف ويعيد التشغيل كل دقيقتين
let _watchdogStarted = false;
function startWatchdog(api) {
  if (_watchdogStarted) return;
  _watchdogStarted = true;
  setInterval(() => {
    try {
      ensureGlobal();
      for (const tid of Object.keys(global.tawsi3Data)) {
        const cfg = global.tawsi3Data[tid];
        const rt  = global.tawsi3Runtime[tid];
        if (!cfg?.active || !rt) continue;
        if (rt.queue.length > 0 && !rt.processing) {
          startProcessor(api, tid);
        }
      }
    } catch(e) {}
  }, 2 * 60 * 1000);
}

module.exports.config = {
  name: "توسيع",
  version: "5.0.0",
  hasPermssion: 3,
  credits: "FANG",
  description: "يرد على رسائل القروب بالترتيب مع وقت قابل للتغيير",
  commandCategory: "أدوات",
  usages: "توسيع | توسيع رسالة [نص] | توسيع وقت [ثوانٍ] | توسيع كسر",
  cooldowns: 3
};

module.exports.onLoad = function({ api } = {}) {
  ensureGlobal();
  const saved = loadData();
  for (const tid in saved) {
    global.tawsi3Data[tid] = saved[tid];
    if (!global.tawsi3Runtime[tid]) {
      global.tawsi3Runtime[tid] = { queue: [], processing: false, timer: null };
    }
  }
  if (api) startWatchdog(api);
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  ensureGlobal();
  startWatchdog(api);

  const sub = (args[0] || "").trim();

  // ── إيقاف ─────────────────────────────────────────────────────────────────
  if (sub === "كسر") {
    ensureThread(threadID);
    const isActive = global.tawsi3Data[threadID]?.active;
    if (!isActive) {
      return api.sendMessage("⚠️ التوسيع غير مفعّل في هذا القروب", threadID, messageID);
    }
    global.tawsi3Data[threadID].active = false;
    const rt = global.tawsi3Runtime[threadID];
    if (rt) {
      rt.queue      = [];
      rt.processing = false;
      if (rt.timer) { clearTimeout(rt.timer); rt.timer = null; }
    }
    const data = loadData();
    if (data[threadID]) data[threadID].active = false;
    saveData(data);
    return api.sendMessage("✅ تم إيقاف التوسيع", threadID, messageID);
  }

  // ── تغيير الرسالة ─────────────────────────────────────────────────────────
  if (sub === "رسالة") {
    const msg = args.slice(1).join(" ").trim();
    if (!msg)
      return api.sendMessage("❌ اكتب الرسالة بعد الأمر\nمثال: توسيع رسالة مرحباً!", threadID, messageID);
    ensureThread(threadID);
    if (!global.tawsi3Data[threadID]) global.tawsi3Data[threadID] = { active: false, msg: "", timeout: DEFAULT_TIMEOUT };
    global.tawsi3Data[threadID].msg = msg;
    const data = loadData();
    if (!data[threadID]) data[threadID] = { active: false, timeout: DEFAULT_TIMEOUT };
    data[threadID].msg = msg;
    saveData(data);
    return api.sendMessage(`✅ تم تحديث الرسالة:\n\n"${msg}"`, threadID, messageID);
  }

  // ── تغيير الوقت ───────────────────────────────────────────────────────────
  if (sub === "وقت") {
    const secs = parseInt(args[1]);
    if (isNaN(secs) || secs < 5 || secs > 3600)
      return api.sendMessage("❌ اكتب وقتاً بين 5 و3600 ثانية\nمثال: توسيع وقت 60", threadID, messageID);
    ensureThread(threadID);
    if (!global.tawsi3Data[threadID]) global.tawsi3Data[threadID] = { active: false, msg: "", timeout: DEFAULT_TIMEOUT };
    global.tawsi3Data[threadID].timeout = secs;
    const data = loadData();
    if (!data[threadID]) data[threadID] = { active: false, msg: "" };
    data[threadID].timeout = secs;
    saveData(data);
    return api.sendMessage(`✅ تم تحديث الوقت إلى ${secs} ثانية`, threadID, messageID);
  }

  // ── عرض الحالة إذا كان مفعّلاً ───────────────────────────────────────────
  ensureThread(threadID);
  if (global.tawsi3Data[threadID]?.active) {
    const c = global.tawsi3Data[threadID];
    return api.sendMessage(
      `⚠️ التوسيع مفعّل بالفعل\n\n` +
      `📢 الرسالة: "${c.msg || ""}"\n` +
      `⏱️ الوقت بين الردود: ${c.timeout || DEFAULT_TIMEOUT} ثانية`,
      threadID, messageID
    );
  }

  // ── تفعيل ─────────────────────────────────────────────────────────────────
  const data = loadData();
  if (!data[threadID]) data[threadID] = { active: false, msg: "", timeout: DEFAULT_TIMEOUT };
  if (!data[threadID].msg) data[threadID].msg = "";
  data[threadID].active = true;

  global.tawsi3Data[threadID] = { ...data[threadID] };
  if (!global.tawsi3Runtime[threadID]) {
    global.tawsi3Runtime[threadID] = { queue: [], processing: false, timer: null };
  } else {
    global.tawsi3Runtime[threadID].processing = false;
    if (global.tawsi3Runtime[threadID].timer) {
      clearTimeout(global.tawsi3Runtime[threadID].timer);
      global.tawsi3Runtime[threadID].timer = null;
    }
  }
  saveData(data);

  const t   = data[threadID].timeout || DEFAULT_TIMEOUT;
  const msg = data[threadID].msg || "";
  return api.sendMessage(
    `✅ تم تفعيل التوسيع!\n\n` +
    `📢 الرسالة: "${msg}"\n` +
    `⏱️ الوقت بين الردود: ${t} ثانية`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  try {
    if (!global.tawsi3Data || !global.tawsi3Runtime) return;

    const { threadID, senderID, type } = event;
    if (type !== "message" && type !== "message_reply") return;

    let botID;
    try { botID = String(api.getCurrentUserID()); } catch(e) { return; }
    if (String(senderID) === botID) return;

    // تحميل حالة الـ thread من الملف إذا لم تكن في الذاكرة
    ensureThread(threadID);

    const cfg = global.tawsi3Data[threadID];
    if (!cfg?.active) return;

    const rt = global.tawsi3Runtime[threadID];
    rt.queue.push({ senderID: String(senderID), ts: Date.now() });

    if (!rt.processing) startProcessor(api, threadID);
  } catch(e) {}
};
