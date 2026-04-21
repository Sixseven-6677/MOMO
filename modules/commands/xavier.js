const fs = require("fs");
const path = require("path");
const xavierIntervals = global.xavierIntervals || (global.xavierIntervals = new Map());
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

module.exports.config = {
  name: "توسيع",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "عند قول تفعيل توسيع يرسل 𝐀𝐔𝐓𝐎 𝐑𝐄𝐏𝐋𝐀𝐘 رسالة كل 30 ثانية",
  commandCategory: "أوامر",
  usages: "تفعيل توسيع | كسر التوسيع",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const body = (args || []).join(" ").trim();

  if (body === "كسر التوسيع" || (args[0] === "كسر" && args[1] === "التوسيع")) {
    if (xavierIntervals.has(threadID)) {
      clearInterval(xavierIntervals.get(threadID));
      xavierIntervals.delete(threadID);
      return api.sendMessage("✅ تم إيقاف Auto Reply", threadID, messageID);
    }
    return api.sendMessage("Auto Reply مو شغال أصلاً", threadID, messageID);
  }

  if (xavierIntervals.has(threadID)) {
    clearInterval(xavierIntervals.get(threadID));
    xavierIntervals.delete(threadID);
  }

  const msg = getMessage();
  api.sendMessage(msg, threadID);

  const interval = setInterval(() => {
    if (!xavierIntervals.has(threadID)) return;
    api.sendMessage(getMessage(), threadID);
  }, 30000);

  xavierIntervals.set(threadID, interval);

  return api.sendMessage("✅ تم تفعيل Auto Reply\nسيتم إرسال الرسالة كل 30 ثانية\nللإيقاف: كسر التوسيع", threadID, messageID);
};

module.exports.handleEvent = async function({ api, event }) {
  if (!event.body) return;
  const body = event.body.trim();
  const { threadID } = event;

  if (body === "تفعيل توسيع") {
    if (xavierIntervals.has(threadID)) {
      clearInterval(xavierIntervals.get(threadID));
      xavierIntervals.delete(threadID);
    }

    const msg = getMessage();
    api.sendMessage(msg, threadID);

    const interval = setInterval(() => {
      if (!xavierIntervals.has(threadID)) return;
      api.sendMessage(getMessage(), threadID);
    }, 30000);

    xavierIntervals.set(threadID, interval);
  }

  if (body.includes("كسر") && body.includes("التوسيع")) {
    if (xavierIntervals.has(threadID)) {
      clearInterval(xavierIntervals.get(threadID));
      xavierIntervals.delete(threadID);
      api.sendMessage("✅ تم إيقاف Auto Reply", threadID);
    } else {
      api.sendMessage("⚠️ Auto Reply مو شغال أصلاً", threadID);
    }
  }
};
