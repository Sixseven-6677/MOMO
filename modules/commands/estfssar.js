const axios = require("axios");

module.exports.config = {
  name: "استفسار",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "البوت يرد على أي سؤال تسأله",
  commandCategory: "أوامر",
  usages: "استفسار [السؤال]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args[0]) {
    return api.sendMessage(
      `𝖨𝗇𝗊𝗎𝗂𝗋𝗒 𝖢𝗈𝗆𝗆𝖺𝗇𝖽 ꗇ\n\n` +
      `اسألني أي سؤال وسأجيبك!\n\n` +
      `مثال: استفسار ما هو الذكاء الاصطناعي؟`,
      threadID, messageID
    );
  }

  const question = args.join(" ");

  try {
    await api.sendMessage("⏳ 𝖳𝗁𝗂𝗇𝗄𝗂𝗇𝗀...", threadID, messageID);

    const response = await axios.get(
      `https://api.simsimi.vn/v1/simsimi?lc=ar&text=${encodeURIComponent(question)}`,
      { timeout: 10000 }
    ).catch(() => null);

    let answer = null;

    if (response?.data?.success) {
      answer = response.data.success;
    }

    if (!answer) {
      const simResponse = await axios.post(
        "https://api.simsimi.net/v2/talk/",
        { lc: "ar", text: question },
        { timeout: 10000 }
      ).catch(() => null);

      if (simResponse?.data?.success) {
        answer = simResponse.data.success;
      }
    }

    if (!answer) {
      const answers = [
        `هذا سؤال رائع! "${question}" - حسب معلوماتي، يمكن البحث عنه أكثر.`,
        `سؤالك عن "${question}" يحتاج دراسة أعمق!`,
        `"${question}" - سؤال مثير للاهتمام!`,
      ];
      answer = answers[Math.floor(Math.random() * answers.length)];
    }

    return api.sendMessage(
      `💬 𝖠𝗇𝗌𝗐𝖾𝗋 ꗇ\n\n${answer}`,
      threadID, messageID
    );
  } catch (e) {
    return api.sendMessage(
      `❌ حدث خطأ أثناء الإجابة، حاول مرة أخرى`,
      threadID, messageID
    );
  }
};
