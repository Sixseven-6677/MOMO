const axios = require("axios");

const generalQuestions = [
  "ما عاصمة المملكة العربية السعودية؟",
  "كم عدد أيام السنة الكبيسة؟",
  "ما هو أكبر محيط في العالم؟",
  "من هو مخترع الهاتف؟",
  "ما هي أطول نهر في العالم؟",
  "كم عدد كواكب المجموعة الشمسية؟",
  "ما هي عاصمة فرنسا؟",
  "من هو أول رائد فضاء في التاريخ؟",
  "ما هو أصغر دولة في العالم؟",
  "ما هو اللون الناتج عن مزج الأزرق والأصفر؟",
];

module.exports.config = {
  name: "اسئلة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "سؤال عشوائي للكروب",
  commandCategory: "أوامر",
  usages: "اسئلة",
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  const question = generalQuestions[Math.floor(Math.random() * generalQuestions.length)];

  return api.sendMessage(
    `❓ 𝗤𝘂𝖾𝗌𝗍𝗂𝗈𝗇 ꗇ\n\n${question}`,
    threadID, messageID
  );
};
