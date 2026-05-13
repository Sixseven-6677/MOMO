const axios = require("axios");
const conversationHistory = new Map(); // threadID -> [{role, parts}]

module.exports.config = {
  name: "فانغ",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "FANG",
  description: "ذكاء اصطناعي — تحدث مع فانغ",
  commandCategory: "ذكاء اصطناعي",
  usages: "فانغ [رسالتك]",
  cooldowns: 3,
  envConfig: {
    GEMINI_KEY: ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const userMsg = args.join(" ").trim();

  if (!userMsg)
    return api.sendMessage(
      "🤖 أنا فانغ، مساعدك الذكي!\nكتب رسالتك بعد الأمر\n\nمثال: فانغ من أنت؟",
      threadID, messageID
    );

  const apiKey = global.config?.فانغ?.GEMINI_KEY || global.configModule?.فانغ?.GEMINI_KEY || "";

  if (!apiKey) {
    return api.sendMessage(
      "⚠️ لم يتم تكوين مفتاح Gemini AI بعد\n\nأضف مفتاحك في config.json:\n\"فانغ\": { \"GEMINI_KEY\": \"مفتاحك\" }\n\nاحصل على مفتاح مجاني من:\naistudio.google.com",
      threadID, messageID
    );
  }

  const waitMsg = await new Promise(r => api.sendMessage("💭 فانغ يفكر...", threadID, (e, i) => r(i)));

  try {
    if (!conversationHistory.has(threadID)) conversationHistory.set(threadID, []);
    const history = conversationHistory.get(threadID);

    history.push({ role: "user", parts: [{ text: userMsg }] });
    if (history.length > 20) history.splice(0, 2); // keep last 10 exchanges

    const systemPrompt = "أنت فانغ، مساعد ذكي ومفيد يتحدث العربية بطلاقة. أنت ودود وخفيف الظل وتساعد الناس بكل ما يحتاجون. تجيب بإجابات مختصرة وواضحة ما لم يُطلب منك التفصيل.";

    const payload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: history
    };

    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      payload,
      { headers: { "Content-Type": "application/json" }, timeout: 20000 }
    );

    const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error("لم أحصل على رد من الذكاء الاصطناعي");

    history.push({ role: "model", parts: [{ text: reply }] });

    if (waitMsg) api.unsendMessage(waitMsg.messageID);
    return api.sendMessage(`🤖 فانغ:\n\n${reply}`, threadID, messageID);

  } catch(err) {
    if (waitMsg) api.unsendMessage(waitMsg.messageID);
    const msg = err.response?.data?.error?.message || err.message;
    return api.sendMessage(`❌ خطأ في الذكاء الاصطناعي:\n${msg}`, threadID, messageID);
  }
};