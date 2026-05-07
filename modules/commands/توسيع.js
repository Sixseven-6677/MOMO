const fs   = require("fs");
const path = require("path");

// ── حالة كل كروب مستقلة ──────────────────────────────────────────────────
// xavierState: Map<threadID, { active, queue, processing, currentTimer }>
const xavierState = global.xavierState || (global.xavierState = new Map());

const msgPath        = path.join(__dirname, "cache/xavier_msg.txt");
const defaultMessage = `🤖 ردٌّ تلقائي\nأنا هنا، تفضل بالتحدث`;

function getMessage() {
  try {
    if (fs.existsSync(msgPath)) return fs.readFileSync(msgPath, "utf8").trim() || defaultMessage;
  } catch (e) {}
  return defaultMessage;
}

function getInterval() {
  const ms = parseInt(global.config?.xavierInterval);
  return (!isNaN(ms) && ms >= 1000) ? ms : 30000;
}

function getBotID(api) {
  try {
    if (typeof api.getCurrentUserID === "function") return String(api.getCurrentUserID());
  } catch (e) {}
  return null;
}

// ── إدارة الحالة ──────────────────────────────────────────────────────────

function getState(threadID) {
  if (!xavierState.has(threadID)) {
    xavierState.set(threadID, {
      active:       false,
      queue:        [],   // { messageID, senderID }
      processing:   false,
      currentTimer: null
    });
  }
  return xavierState.get(threadID);
}

// إعادة ضبط كاملة — يُستخدم عند الكسر أو التفعيل من جديد
function resetState(threadID) {
  const s = getState(threadID);
  if (s.currentTimer) { clearTimeout(s.currentTimer); s.currentTimer = null; }
  s.active     = false;
  s.queue      = [];
  s.processing = false;
}

// ── معالجة الطابور بشكل تسلسلي ───────────────────────────────────────────

function processNext(api, threadID) {
  const s = getState(threadID);

  // إذا أُلغي التوسيع أو الطابور فارغ — توقف
  if (!s.active || s.queue.length === 0) {
    s.processing = false;
    return;
  }

  s.processing = true;
  const msg = s.queue.shift();   // خذ أول رسالة في الطابور
  const ms  = getInterval();

  s.currentTimer = setTimeout(() => {
    s.currentTimer = null;

    // إذا أُلغي التوسيع أثناء الانتظار — ألغِ ولا ترد
    if (!s.active) {
      s.processing = false;
      return;
    }

    // إرسال للكروب بدون رد على رسالة محددة
    try {
      api.sendMessage(getMessage(), threadID);
    } catch (e) {}

    // انتقل للرسالة التالية في الطابور
    processNext(api, threadID);
  }, ms);
}

// ── أوامر التفعيل والإيقاف ────────────────────────────────────────────────

function activate(api, threadID, messageID) {
  resetState(threadID);
  const s    = getState(threadID);
  s.active   = true;
  const ms   = getInterval();
  return api.sendMessage(
    `✅ تم تفعيل التوسيع\n` +
    `سيرد البوت على كل رسالة بعد ${ms / 1000} ثانية\n` +
    `الردود تسلسلية — رسالة فرسالة\n\n` +
    `للإيقاف وإلغاء كل الردود المعلقة: توسيع كسر`,
    threadID, messageID
  );
}

function deactivate(api, threadID, messageID) {
  const s = getState(threadID);
  if (!s.active && s.queue.length === 0 && !s.processing) {
    return api.sendMessage("⚠️ التوسيع مو شغال أصلاً", threadID, messageID);
  }
  const pending = s.queue.length + (s.processing ? 1 : 0);
  resetState(threadID);
  return api.sendMessage(
    `✅ تم إيقاف التوسيع\n` +
    `${pending > 0 ? `🗑️ تم إلغاء ${pending} رسالة معلقة` : "لا توجد رسائل معلقة"}`,
    threadID, messageID
  );
}

// ── تصدير الأمر ───────────────────────────────────────────────────────────

module.exports.config = {
  name:            "توسيع",
  version:         "5.0.0",
  hasPermssion:    0,
  credits:         "MOMO",
  description:     "ردّ تسلسلي على الرسائل — رسالة بعد رسالة مع cooldown بينها",
  commandCategory: "أوامر",
  usages:          "توسيع | توسيع كسر",
  cooldowns:       0
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  if (args[0] === "كسر" || args[0] === "توقف") return deactivate(api, threadID, messageID);
  return activate(api, threadID, messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
  if (!event) return;
  if (event.type !== "message" && event.type !== "message_reply") return;
  if (!event.body || !event.body.trim()) return;

  const { threadID, senderID, messageID } = event;
  const s = getState(threadID);
  if (!s.active) return;

  // تجاهل رسائل البوت نفسه
  const botID = getBotID(api);
  if (botID && String(senderID) === botID) return;

  // تجاهل أوامر البوت
  const prefix = global.config?.PREFIX || "";
  if (prefix && event.body.startsWith(prefix)) return;

  // تجاهل أمر "توسيع كسر" نفسه
  const body = event.body.trim();
  if (body === "توسيع" || body === "توسيع كسر" || body === "توسيع توقف") return;

  // أضف الرسالة للطابور
  s.queue.push({ messageID, senderID });

  // إذا ما في شيء يُعالَج الآن — ابدأ فوراً
  if (!s.processing) {
    processNext(api, threadID);
  }
};
