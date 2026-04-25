module.exports.config = {
  name: "لستة",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "عرض قائمة جميع الأوامر مع طريقة الاستخدام مرتبة حسب الفئة",
  commandCategory: "أوامر",
  usages: "لستة",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  const { commands } = global.client;

  const all = [...commands.values()];

  // Group commands by category
  const groups = new Map();
  for (const cmd of all) {
    const cat = (cmd.config.commandCategory || "أخرى").trim() || "أخرى";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(cmd);
  }

  // Sort each group by name
  for (const [, list] of groups) {
    list.sort((a, b) => a.config.name.localeCompare(b.config.name, "ar"));
  }

  const sortedCats = [...groups.keys()].sort((a, b) => a.localeCompare(b, "ar"));

  let counter = 0;
  const sections = sortedCats.map(cat => {
    const lines = groups.get(cat).map(cmd => {
      counter++;
      const name = cmd.config.name;
      const usage = cmd.config.usages || name;
      const desc = cmd.config.description || "";
      return `${counter}. ${name}\n   📌 ${desc}\n   ✏️ ${usage}`;
    });
    return `━━━ ${cat} (${groups.get(cat).length}) ━━━\n\n${lines.join("\n\n")}`;
  });

  const msg =
    `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n` +
    `➢︱ 𝑿𝑨𝑽𝑰𝑬𝑹 ᚔ 𝑪𝑴𝑫 𝑳𝑰𝑺𝑻 ︱⚕\n` +
    `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n\n` +
    sections.join("\n\n") +
    `\n\n⧺ إجمالي الأوامر: ${all.length} ⧺`;

  return api.sendMessage(msg, threadID, messageID);
};
