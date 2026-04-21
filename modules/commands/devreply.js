const devTriggers = [
  "من مطورك", "من مطوّرك", "مين مطورك", "مين مطوّرك",
  "من صنعك", "مين صنعك", "من اللي صنعك", "مين اللي صنعك",
  "من برمجك", "مين برمجك", "من اللي برمجك",
  "مبرمجك", "مطورك", "مطوّرك", "صانعك", "خالقك",
  "من سواك", "مين سواك", "من اللي سواك", "مين اللي سواك",
  "من عملك", "مين عملك", "من اللي عملك", "مين اللي عملك",
  "who made you", "who created you", "who developed you", "your developer", "your creator"
];

const devReply = "مطوري هو خافيير العظيم صنعني وطورني وأحسن تطويري ليت الجميع مثله";

module.exports.config = {
  name: "مطور",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "يرد عند السؤال عن مطور البوت",
  commandCategory: "نظام",
  usages: "مطور",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  return api.sendMessage(devReply, event.threadID, event.messageID);
};

module.exports.handleEvent = async function({ api, event }) {
  if (!event.body) return;
  const body = event.body.trim().toLowerCase();
  if (body.length < 3) return;

  const matched = devTriggers.some(t => body.includes(t.toLowerCase()));
  if (!matched) return;

  const botID = String(api.getCurrentUserID());
  if (String(event.senderID) === botID) return;

  return api.sendMessage(devReply, event.threadID, event.messageID);
};
