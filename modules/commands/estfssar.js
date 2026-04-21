const axios = require("axios");

module.exports.config = {
  name: "استفسار",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "البوت يرد على أي سؤال بذكاء اصطناعي",
  commandCategory: "أوامر",
  usages: "استفسار [السؤال]",
  cooldowns: 5
};

async function askAI(question) {
  const devTriggers = ["مطورك", "مطوّرك", "صنعك", "من صنع", "من برمج", "مبرمجك", "خالقك", "صانعك", "اللي سواك", "اللي عملك", "who made you", "who created you", "your developer"];
  if (devTriggers.some(t => question.includes(t))) {
    return "مطوري هو خافيير العظيم صنعني وطورني وأحسن تطويري ليت الجميع مثله";
  }

  const systemPrompt = "أنت مساعد ذكاء اصطناعي. أجب باختصار وبالعربية الفصحى. مطورك هو خافيير العظيم. إذا سُئلت عن من صنعك أو طورك قل: مطوري هو خافيير العظيم صنعني وطورني وأحسن تطويري ليت الجميع مثله";
  const fullPrompt = `${systemPrompt}\n\nالسؤال: ${question}\nالجواب:`;

  try {
    const r = await axios.get(
      `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`,
      { timeout: 25000, responseType: "text" }
    );
    if (r.data && String(r.data).trim().length > 0) return String(r.data).trim().slice(0, 1800);
  } catch (e) {}

  try {
    const r = await axios.post(
      "https://text.pollinations.ai/openai",
      {
        model: "openai",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ]
      },
      { timeout: 25000 }
    );
    const ans = r.data?.choices?.[0]?.message?.content;
    if (ans) return String(ans).trim().slice(0, 1800);
  } catch (e) {}

  return null;
}

module.exports.askAI = askAI;

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args[0]) {
    return api.sendMessage(
      `𝖨𝗇𝗊𝗎𝗂𝗋𝗒 𝖢𝗈𝗆𝗆𝖺𝗇𝖽 ꗇ\n\nاسألني أي سؤال وسأجيبك!\n\nمثال: استفسار ما هو الذكاء الاصطناعي؟`,
      threadID, messageID
    );
  }

  const question = args.join(" ");
  api.sendMessage("⏳ 𝖳𝗁𝗂𝗇𝗄𝗂𝗇𝗀...", threadID, async (err, info) => {
    const thinkingID = info && info.messageID;
    const answer = await askAI(question);

    if (thinkingID && api.unsendMessage) {
      try { api.unsendMessage(thinkingID, () => {}); } catch (e) {}
    }

    if (!answer) {
      return api.sendMessage("❌ تعذر الحصول على إجابة الآن، حاول مرة أخرى", threadID, messageID);
    }
    return api.sendMessage(`💬 𝖠𝗇𝗌𝗐𝖾𝗋 ꗇ\n\n${answer}`, threadID, messageID);
  }, messageID);
};
