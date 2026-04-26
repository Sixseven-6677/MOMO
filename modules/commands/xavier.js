const fs = require("fs");
const path = require("path");

const xavierActive = global.xavierActive || (global.xavierActive = new Set());
const xavierQueue = global.xavierQueue || (global.xavierQueue = new Map());
const xavierRecent = global.xavierRecent || (global.xavierRecent = new Map());

const msgPath = path.join(__dirname, "cache/xavier_msg.txt");

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
  version: "3.1.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "Auto Reply: يرد على كل رسالة بعد المدة المحددة في وقت. لو 5 رسائل متتالية بفارق ثانية → يرد على آخر 3 فقط",
  commandCategory: "أوامر",
  usages: "خافير | خافير توقف",
  cooldowns: 0
};

async function activate(api, threadID, messageID) {
  xavierActive.add(threadID);
  clearQueue(threadID);
  const ms = getInterval();
  return api.sendMessage(
    `✅ تم تفعيل Auto Reply\n` +
    `سيرد البوت على كل رسالة بعد ${ms / 1000} ثانية\n` +
    `لتغيير المدة: وقت [عدد الثواني]\n` +
    `للإيقاف: خافير توقف`,
    threadID, messageID
  );
}

async function deactivate(api, threadID, messageID) {
  if (!xavierActive.has(threadID)) {
    return api.sendMessage("Auto Reply مو شغال أصلاً", threadID, messageID);
  }
  xavierActive.delete(threadID);
  clearQueue(threadID);
  return api.sendMessage("✅ تم إيقاف Auto Reply", threadID, messageID);
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

  if (body === "خافير") return activate(api, threadID, messageID);
  if (body === "خافير توقف") return deactivate(api, threadID, messageID);

  if (!xavierActive.has(threadID)) return;

  const botID = getBotID(api);
  if (botID && String(senderID) === botID) return;

  enqueueReply(api, threadID, messageID);
};
