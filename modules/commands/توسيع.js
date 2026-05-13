const fs   = require("fs");
const path = require("path");

const xavierState = global.xavierState || (global.xavierState = new Map());

const msgPath      = path.join(__dirname, "cache/xavier_msg.txt");
const intervalPath = path.join(__dirname, "cache/xavier_interval.txt");
const defaultMsg   = "🤖 ردٌّ تلقائي\nأنا هنا، تفضل بالتحدث";

function getMessage() {
  try {
    if (fs.existsSync(msgPath)) return fs.readFileSync(msgPath, "utf8").trim() || defaultMsg;
  } catch(e) {}
  return defaultMsg;
}

function saveMessage(text) {
  try {
    const dir = path.dirname(msgPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(msgPath, text, "utf8");
  } catch(e) {}
}

function getInterval() {
  try {
    if (fs.existsSync(intervalPath)) {
      const ms = parseInt(fs.readFileSync(intervalPath, "utf8").trim());
      if (!isNaN(ms) && ms >= 5000) return ms;
    }
  } catch(e) {}
  return 30000;
}

function saveInterval(ms) {
  try {
    const dir = path.dirname(intervalPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(intervalPath, String(ms), "utf8");
  } catch(e) {}
}

function getBotID(api) {
  try { return String(api.getCurrentUserID()); } catch(e) { return null; }
}

function getState(threadID) {
  if (!xavierState.has(threadID)) {
    xavierState.set(threadID, { active: false, queue: [], processing: false, currentTimer: null });
  }
  return xavierState.get(threadID);
}

function resetState(threadID) {
  const s = getState(threadID);
  if (s.currentTimer) { clearTimeout(s.currentTimer); s.currentTimer = null; }
  s.active     = false;
  s.queue      = [];
  s.processing = false;
}

function processNext(api, threadID) {
  const s = getState(threadID);
  if (!s.active || s.queue.length === 0) { s.processing = false; return; }
  s.processing = true;
  const ms = getInterval();
  s.currentTimer = setTimeout(() => {
    s.currentTimer = null;
    if (!s.active) { s.processing = false; return; }
    try { api.sendMessage(getMessage(), threadID); } catch(e) {}
    processNext(api, threadID);
  }, ms);
}

function activate(api, threadID, messageID) {
  resetState(threadID);
  const s  = getState(threadID);
  s.active = true;
  const ms = getInterval();
  return api.sendMessage(
    `✅ تم تفعيل التوسيع\n` +
    `⏱ سيرد البوت على كل رسالة بعد ${ms / 1000} ثانية\n` +
    `📝 الرسالة: "${getMessage()}"\n\n` +
    `للإيقاف: توسيع كسر\nلعرض الحالة: توسيع حالة`,
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
    `${pending > 0 ? "🗑️ تم إلغاء " + pending + " رسالة معلقة" : "لا توجد رسائل معلقة"}`,
    threadID, messageID
  );
}

module.exports.config = {
  name:            "توسيع",
  version:         "6.0.0",
  hasPermssion:    0,
  credits:         "MOMO",
  description:     "ردّ تسلسلي على الرسائل مع إمكانية تعديل الرسالة والوقت",
  commandCategory: "أوامر",
  usages:          "توسيع | توسيع كسر | توسيع رسالة [نص] | توسيع وقت [ثواني] | توسيع حالة",
  cooldowns:       0
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const sub = args[0];

  if (sub === "كسر" || sub === "توقف") return deactivate(api, threadID, messageID);

  if (sub === "رسالة") {
    const text = args.slice(1).join(" ").trim();
    if (!text) return api.sendMessage("❌ اكتب الرسالة بعد الأمر\nمثال: توسيع رسالة أهلاً بك 👋", threadID, messageID);
    saveMessage(text);
    return api.sendMessage(`✅ تم حفظ رسالة التوسيع:\n\n"${text}"`, threadID, messageID);
  }

  if (sub === "وقت") {
    const sec = parseInt(args[1]);
    if (isNaN(sec) || sec < 5) return api.sendMessage("❌ اكتب عدد الثواني (5 أو أكثر)\nمثال: توسيع وقت 30", threadID, messageID);
    saveInterval(sec * 1000);
    return api.sendMessage(`✅ تم ضبط التأخير: ${sec} ثانية`, threadID, messageID);
  }

  if (sub === "حالة") {
    const activeGroups = [];
    for (const [tid, s] of xavierState.entries()) {
      if (s.active) activeGroups.push({ tid, s });
    }
    const currentMsg = getMessage();
    const ms = getInterval();
    if (activeGroups.length === 0) {
      return api.sendMessage(
        `📊 حالة التوسيع:\n━━━━━━━━━━\n🔴 غير نشط في أي غروب\n\n📝 الرسالة المحفوظة:\n"${currentMsg}"\n\n⏱ التأخير: ${ms / 1000} ثانية`,
        threadID, messageID
      );
    }
    const groupLines = [];
    for (const { tid, s } of activeGroups) {
      let name = tid;
      try { const info = await api.getThreadInfo(tid); name = info.threadName || tid; } catch(e) {}
      const pending = s.queue.length + (s.processing ? 1 : 0);
      groupLines.push(`🟢 ${name}\n   📨 ${pending} رسالة معلقة`);
    }
    return api.sendMessage(
      `📊 حالة التوسيع:\n━━━━━━━━━━\n🟢 نشط في ${activeGroups.length} غروب\n\n${groupLines.join("\n\n")}\n\n📝 الرسالة:\n"${currentMsg}"\n\n⏱ التأخير: ${ms / 1000} ثانية`,
      threadID, messageID
    );
  }

  return activate(api, threadID, messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
  if (!event) return;
  if (event.type !== "message" && event.type !== "message_reply") return;
  if (!event.body || !event.body.trim()) return;

  const { threadID, senderID } = event;
  const s = getState(threadID);
  if (!s.active) return;

  const botID = getBotID(api);
  if (botID && String(senderID) === botID) return;

  const body = event.body.trim();
  if (body === "توسيع" || body === "توسيع كسر" || body === "توسيع توقف" || body.startsWith("توسيع رسالة") || body.startsWith("توسيع وقت") || body === "توسيع حالة") return;

  s.queue.push({ senderID });
  if (!s.processing) processNext(api, threadID);
};
