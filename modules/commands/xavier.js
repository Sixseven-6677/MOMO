const fs = require("fs");
const path = require("path");

const xavierActive = global.xavierActive || (global.xavierActive = new Set());
const xavierTimers = global.xavierTimers || (global.xavierTimers = new Map());

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

function clearThreadTimer(threadID) {
  const existing = xavierTimers.get(threadID);
  if (existing && existing.timeout) clearTimeout(existing.timeout);
  xavierTimers.delete(threadID);
}

function getBotID(api) {
  try {
    if (typeof api.getCurrentUserID === "function") return String(api.getCurrentUserID());
  } catch (e) {}
  return null;
}

function scheduleReply(api, threadID, messageID) {
  clearThreadTimer(threadID);
  const ms = getInterval();
  const timeout = setTimeout(() => {
    if (!xavierActive.has(threadID)) {
      clearThreadTimer(threadID);
      return;
    }
    try {
      api.sendMessage(getMessage(), threadID, messageID);
    } catch (e) {}
    xavierTimers.delete(threadID);
  }, ms);
  xavierTimers.set(threadID, { timeout, messageID });
}

module.exports.config = {
  name: "خافير",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "Auto Reply: يرد على آخر رسالة في القروب بعد توقف الرسائل بالمدة المحددة في أمر (وقت)",
  commandCategory: "أوامر",
  usages: "خافير | خافير توقف",
  cooldowns: 0
};

async function activate(api, threadID, messageID) {
  xavierActive.add(threadID);
  clearThreadTimer(threadID);
  const ms = getInterval();
  return api.sendMessage(
    `✅ تم تفعيل Auto Reply\n` +
    `سيرد البوت على آخر رسالة في القروب بعد ${ms / 1000} ثانية من توقف الرسائل\n` +
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
  clearThreadTimer(threadID);
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

  if (body === "خافير") {
    return activate(api, threadID, messageID);
  }
  if (body === "خافير توقف") {
    return deactivate(api, threadID, messageID);
  }

  if (!xavierActive.has(threadID)) return;

  const botID = getBotID(api);
  if (botID && String(senderID) === botID) return;

  scheduleReply(api, threadID, messageID);
};
