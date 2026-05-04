const fs = require("fs");
const path = require("path");

const xavierActive = global.xavierActive || (global.xavierActive = new Set());
const xavierQueue = global.xavierQueue || (global.xavierQueue = new Map());
const xavierRecent = global.xavierRecent || (global.xavierRecent = new Map());

const msgPath = path.join(__dirname, "cache/xavier_msg.txt");

const defaultMessage = `🤖 ردٌّ تلقائي\nأنا هنا، تفضل بالتحدث\nللإيقاف: خافير توقف`;

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

function getBotID(api) {
  try {
    if (typeof api.getCurrentUserID === "function") return String(api.getCurrentUserID());
  } catch (e) {}
  return null;
}

function clearQueue(threadID) {
  const q = xavierQueue.get(threadID);
  if (q) q.forEach(it => clearTimeout(it.timer));
  xavierQueue.delete(threadID);
  xavierRecent.delete(threadID);
}

function enqueueReply(api, threadID, messageID) {
  const ms = getInterval();
  let queue = xavierQueue.get(threadID);
  if (!queue) { queue = []; xavierQueue.set(threadID, queue); }

  let recent = xavierRecent.get(threadID) || [];
  const now = Date.now();
  recent.push(now);
  if (recent.length > 5) recent = recent.slice(-5);
  xavierRecent.set(threadID, recent);

  const item = { messageID, scheduledAt: now + ms };
  item.timer = setTimeout(() => {
    const idx = queue.indexOf(item);
    if (idx !== -1) queue.splice(idx, 1);
    if (!xavierActive.has(threadID)) return;
    try { api.sendMessage(getMessage(), threadID, messageID); } catch (e) {}
  }, ms);
  queue.push(item);

  if (recent.length >= 5) {
    let isBurst = true;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i] - recent[i - 1] > 1000) { isBurst = false; break; }
    }
    if (isBurst && queue.length > 3) {
      const tail = queue.slice(-3);
      const toCancel = queue.slice(0, queue.length - 3);
      toCancel.forEach(it => clearTimeout(it.timer));
      queue.length = 0;
      tail.forEach(it => queue.push(it));
      xavierQueue.set(threadID, queue);
    }
  }
}

module.exports.config = {
  name: "خافير",
  version: "3.2.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "Auto Reply: يرد على كل رسالة بعد المدة المحددة",
  commandCategory: "أوامر",
  usages: "خافير | خافير توقف",
  cooldowns: 0
};

async function activate(api, threadID, messageID) {
  xavierActive.add(threadID);
  clearQueue(threadID);
  const ms = getInterval();
  return api.sendMessage(
    `✅ تم تفعيل الرد التلقائي\nسيرد البوت على كل رسالة بعد ${ms / 1000} ثانية\nللإيقاف: خافير توقف`,
    threadID, messageID
  );
}

async function deactivate(api, threadID, messageID) {
  if (!xavierActive.has(threadID)) {
    return api.sendMessage("⚠️ الرد التلقائي مو شغال أصلاً", threadID, messageID);
  }
  xavierActive.delete(threadID);
  clearQueue(threadID);
  return api.sendMessage("✅ تم إيقاف الرد التلقائي", threadID, messageID);
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  if (args[0] === "توقف") return deactivate(api, threadID, messageID);
  return activate(api, threadID, messageID);
};

module.exports.handleEvent = async function({ api, event }) {
  if (!event || !event.body) return;
  const body = event.body.trim();
  const { threadID, messageID, senderID } = event;

  if (!xavierActive.has(threadID)) return;

  const botID = getBotID(api);
  if (botID && String(senderID) === botID) return;

  enqueueReply(api, threadID, messageID);
};
