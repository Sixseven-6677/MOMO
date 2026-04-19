module.exports.config = {
  name: "الادمنز",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "عرض قائمة أدمن البوت",
  commandCategory: "أوامر",
  usages: "الادمنز",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const adminIDs = global.config.ADMINBOT || [];

  if (!adminIDs.includes(String(senderID))) {
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);
  }

  if (adminIDs.length === 0) {
    return api.sendMessage("ما في أدمن مسجلين حالياً", threadID, messageID);
  }

  let names = [];
  for (const id of adminIDs) {
    try {
      const info = await api.getUserInfo(id);
      const name = info[id]?.name || id;
      names.push({ id, name });
    } catch (e) {
      names.push({ id, name: id });
    }
  }

  const msg =
    `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n` +
    `➢︱ 𝑿𝑨𝑽𝑰𝑬𝑹 ᚔ 𝑨𝑫𝑴𝑰𝑵𝑺 ︱⚕\n` +
    `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n\n` +
    names.map((a, i) => `${i + 1}. ${a.name}\n   ID: ${a.id}`).join("\n\n") +
    `\n\n⧺ إجمالي الأدمن: ${names.length} ⧺`;

  return api.sendMessage(msg, threadID, messageID);
};
