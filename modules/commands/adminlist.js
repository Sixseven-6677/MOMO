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
    `˖ִ 〆 ↯ 𝐀𝕯𝖬𝖨𝖭𝖲 𒀱 𝛃𝐎𝐓⋆ ⏤ \n\n` +
    names.map((a, i) => `${i + 1}. ${a.name}\n   ID: ${a.id}`).join("\n\n") +
    `\n\nꖛ إجمالي الأدمن: ${names.length} ⌬`;

  return api.sendMessage(msg, threadID, messageID);
};
