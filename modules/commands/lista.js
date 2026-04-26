module.exports.config = {
  name: "لستة",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "عرض قائمة جميع الأوامر مع طريقة الاستخدام",
  commandCategory: "أوامر",
  usages: "لستة",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  const { commands } = global.client;

  const list = [...commands.values()].sort((a, b) =>
    a.config.name.localeCompare(b.config.name)
  );

  const lines = list.map((cmd, i) => {
    const name = cmd.config.name;
    const usage = cmd.config.usages || name;
    const desc = cmd.config.description || "";
    return `${i + 1}. ${name}\n   📌 ${desc}\n   ✏️ ${usage}`;
  });

  const msg =
    `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n` +
    `➢︱ 𝑿𝑨𝑽𝑰𝑬𝑹 ᚔ 𝑪𝑴𝑫 𝑳𝑰𝑺𝑻 ︱⚕\n` +
    `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n\n` +
    lines.join("\n\n") +
    `\n\n⧺ إجمالي الأوامر: ${list.length} ⧺`;

  return api.sendMessage(msg, threadID, messageID);
};
