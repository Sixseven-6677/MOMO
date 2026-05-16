const fs   = require("fs");
const path = require("path");

const dataPath = path.join(process.cwd(), "modules/commands/data/tawsi3.json");

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

const DEFAULT_MSG     = "👀 القروب نشط! هل تريد الانضمام؟ تواصل مع البوت 🤖";
const DEFAULT_TIMEOUT = 30; // seconds

// ── معالج الطابور — مُحسَّن بحماية deadlock ─────────────────────────────────
function startProcessor(api, threadID) {
  if (!global.tawsi3Runtime) global.tawsi3Runtime = {};
  const rt  = global.tawsi3Runtime[threadID];
  const cfg = global.tawsi3Data && global.tawsi3Data[threadID];
  if (!rt || rt.processing || !cfg || !cfg.active || rt.queue.length === 0) return;

  rt.processing = true;

  async function step() {
    const r = global.tawsi3Runtime[threadID];
    const c = global.tawsi3Data && global.tawsi3Data[threadID];

    // توقف إذا فُرِّغ الطابور أو أُوقف التوسيع
    if (!r || !c || !c.active || r.queue.length === 0) {
      if (r) r.processing = false;
      return;
    }

    r.queue.shift(); // أزل العنصر من الطابور

    try {
      await new Promise((resolve, reject) => {
        api.sendMessage(c.msg || DEFAULT_MSG, threadID, (err) => {
          if (err) reject(err); else resolve();
        });
      });
    } catch(err) {
      // فشل الإرسال — لا تعطّل المعالج، استمر بعد التأخير
      console.error(`[توسيع] sendMessage error in ${threadID}:`, err?.error || err);
    }

    // انتظر قبل الرسالة التالية
    const delay = ((c.timeout || DEFAULT_TIMEOUT) * 1000);
    await new Promise(res => setTimeout(res, delay));

    // تأكد أن التوسيع لا يزال نشطاً بعد الانتظار
    const rAfter = global.tawsi3Runtime[threadID];
    const cAfter = global.tawsi3Data && global.tawsi3Data[threadID];
    if (!rAfter || !cAfter || !cAfter.active) {
      if (rAfter) rAfter.processing = false;
      return;
    }

    step(); // استمر بالمعالجة
  }

  step();
}

// ── Watchdog: يكشف deadlock كل دقيقتين ويُعيد تشغيل المعالج ───────────────
let _watchdogStarted = false;
function startWatchdog(api) {
  if (_watchdogStarted) return;
  _watchdogStarted = true;
  setInterval(() => {
    try {
      if (!global.tawsi3Runtime || !global.tawsi3Data) return;
      for (const tid of Object.keys(global.tawsi3Data)) {
        const cfg = global.tawsi3Data[tid];
        const rt  = global.tawsi3Runtime[tid];
        if (!cfg?.active || !rt) continue;
        // إذا الطابور فيه رسائل لكن المعالج واقف → أعد تشغيله
        if (rt.queue.length > 0 && !rt.processing) {
          console.log(`[توسيع] Watchdog: restarting stalled processor for ${tid}`);
          startProcessor(api, tid);
        }
      }
    } catch(e) {}
  }, 2 * 60 * 1000); // كل دقيقتين
}
// ─────────────────────────────────────────────────────────────────────────────

module.exports.config = {
  name: "توسيع",
  version: "4.0.0",
  hasPermssion: 1,
  credits: "FANG",
  description: "يخزن رسائل القروب في طابور ويرد عليها بالترتيب مع وقت قابل للتغيير",
  commandCategory: "أدوات",
  usages: "توسيع | توسيع رسالة [نص] | توسيع كسر",
  cooldowns: 3
};

module.exports.onLoad = function({ api } = {}) {
  if (!global.tawsi3Data)    global.tawsi3Data    = {};
  if (!global.tawsi3Runtime) global.tawsi3Runtime = {};
  const saved = loadData();
  for (const tid in saved) {
    global.tawsi3Data[tid] = saved[tid];
    if (!global.tawsi3Runtime[tid]) {
      global.tawsi3Runtime[tid] = { queue: [], processing: false };
    }
  }
  // ابدأ الـ Watchdog إذا كان api متاحاً (عند onLoad بعد login)
  if (api) startWatchdog(api);
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  if (!global.tawsi3Data)    global.tawsi3Data    = {};
  if (!global.tawsi3Runtime) global.tawsi3Runtime = {};

  // ابدأ الـ Watchdog من أول أمر يُنفَّذ
  startWatchdog(api);

  const data = loadData();
  const sub  = (args[0] || "").trim();

  // ── إيقاف ────────────────────────────────────────────────────────────────
  if (sub === "كسر") {
    if (!data[threadID]?.active)
      return api.sendMessage("⚠️ التوسيع غير مفعّل في هذا القروب", threadID, messageID);
    data[threadID].active = false;
    global.tawsi3Data[threadID] = { ...data[threadID] };
    if (global.tawsi3Runtime[threadID]) {
      global.tawsi3Runtime[threadID].queue      = [];
      global.tawsi3Runtime[threadID].processing = false;
    }
    saveData(data);
    return api.sendMessage("✅ تم إيقاف التوسيع في هذا القروب وتفريغ الطابور", threadID, messageID);
  }

  // ── تغيير الرسالة ─────────────────────────────────────────────────────────
  if (sub === "رسالة") {
    const msg = args.slice(1).join(" ").trim();
    if (!msg)
      return api.sendMessage(
        "❌ اكتب الرسالة بعد الأمر\nمثال: توسيع رسالة مرحباً بكم في قروبنا!",
        threadID, messageID
      );
    if (!data[threadID]) data[threadID] = { active: false, msg: DEFAULT_MSG, timeout: DEFAULT_TIMEOUT };
    data[threadID].msg = msg;
    global.tawsi3Data[threadID] = { ...data[threadID] };
    saveData(data);
    return api.sendMessage(`✅ تم تحديث رسالة التوسيع:\n\n"${msg}"`, threadID, messageID);
  }

  // ── تغيير الوقت ───────────────────────────────────────────────────────────
  if (sub === "وقت") {
    const secs = parseInt(args[1]);
    if (isNaN(secs) || secs < 5 || secs > 3600)
      return api.sendMessage("❌ اكتب وقتاً بين 5 و3600 ثانية\nمثال: توسيع وقت 60", threadID, messageID);
    if (!data[threadID]) data[threadID] = { active: false, msg: DEFAULT_MSG, timeout: DEFAULT_TIMEOUT };
    data[threadID].timeout = secs;
    global.tawsi3Data[threadID] = { ...data[threadID] };
    saveData(data);
    return api.sendMessage(`✅ تم تحديث وقت التوسيع إلى ${secs} ثانية`, threadID, messageID);
  }

  // ── عرض الحالة إذا كان مفعّلاً ───────────────────────────────────────────
  if (data[threadID]?.active) {
    const t    = data[threadID].timeout || DEFAULT_TIMEOUT;
    const qLen = global.tawsi3Runtime[threadID]?.queue?.length || 0;
    const isProc = global.tawsi3Runtime[threadID]?.processing || false;
    return api.sendMessage(
      `⚠️ التوسيع مفعّل بالفعل في هذا القروب\n\n` +
      `📢 الرسالة: "${data[threadID].msg || DEFAULT_MSG}"\n` +
      `⏱️ الوقت بين الردود: ${t} ثانية\n` +
      `📬 الرسائل في الطابور: ${qLen}\n` +
      `⚙️ المعالج: ${isProc ? '🟢 يعمل' : '🔴 واقف'}\n\n` +
      `لتغيير الرسالة: توسيع رسالة [النص]\n` +
      `لتغيير الوقت: توسيع وقت [ثوانٍ]\n` +
      `للإيقاف: توسيع كسر`,
      threadID, messageID
    );
  }

  // ── تفعيل جديد ────────────────────────────────────────────────────────────
  if (!data[threadID]) data[threadID] = { active: false, msg: DEFAULT_MSG, timeout: DEFAULT_TIMEOUT };
  data[threadID].active = true;
  global.tawsi3Data[threadID] = { ...data[threadID] };
  if (!global.tawsi3Runtime[threadID]) {
    global.tawsi3Runtime[threadID] = { queue: [], processing: false };
  } else {
    // صفّر الـ deadlock إن وُجد
    global.tawsi3Runtime[threadID].processing = false;
  }
  saveData(data);

  const t = data[threadID].timeout || DEFAULT_TIMEOUT;
  return api.sendMessage(
    `✅ تم تفعيل التوسيع!\n\n` +
    `📢 الرسالة: "${data[threadID].msg || DEFAULT_MSG}"\n` +
    `⏱️ الوقت بين الردود: ${t} ثانية\n\n` +
    `كل رسالة في القروب تُضاف للطابور وتُرسل الرسالة بالترتيب.\n\n` +
    `لتغيير الرسالة: توسيع رسالة [النص]\n` +
    `لتغيير الوقت: توسيع وقت [ثوانٍ]\n` +
    `للإيقاف: توسيع كسر`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  try {
    if (!global.tawsi3Data || !global.tawsi3Runtime) return;

    const { threadID, senderID, type } = event;
    if (type !== "message" && type !== "message_reply") return;

    // لا يرد على نفسه
    let botID;
    try { botID = String(api.getCurrentUserID()); } catch(e) { return; }
    if (String(senderID) === botID) return;

    const cfg = global.tawsi3Data[threadID];
    if (!cfg?.active) return;

    // تهيئة runtime إذا لم يكن موجوداً
    if (!global.tawsi3Runtime[threadID]) {
      global.tawsi3Runtime[threadID] = { queue: [], processing: false };
    }
    const rt = global.tawsi3Runtime[threadID];

    // أضف للطابور
    rt.queue.push({ senderID: String(senderID), ts: Date.now() });

    // شغّل المعالج إذا لم يكن يعمل
    if (!rt.processing) startProcessor(api, threadID);

  } catch(e) {}
};
