const axios = require("axios");

const userHistories = new Map();
const MAX_HISTORY = 10;

module.exports.config = {
  name: "ذكاء",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "ذكاء اصطناعي يجيب على أسئلتك ويتذكر المحادثة",
  commandCategory: "أوامر",
  usages: "ذكاء {سؤالك} | ذكاء مسح",
  cooldowns: 3
};

async function askGroq(messages, apiKey) {
  const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
    model: "llama-3.3-70b-versatile",
    messages,
    max_tokens: 1024,
    temperature: 0.7
  }, {
    timeout: 20000,
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
  });
  return res.data?.choices?.[0]?.message?.content || null;
}

async function askOpenAI(messages, apiKey) {
  const res = await axios.post("https://api.openai.com/v1/chat/completions", {
    model: "gpt-4o-mini",
    messages,
    max_tokens: 1024,
    temperature: 0.7
  }, {
    timeout: 20000,
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
  });
  return res.data?.choices?.[0]?.message?.content || null;
}

// محاولة GET البسيطة من pollinations (الأسرع والأموثوق)
async function askPollinationsGET(messages) {
  const system = (messages.find(m => m.role === "system") || {}).content || "";
  const lastUser = [...messages].reverse().find(m => m.role === "user");
  if (!lastUser) return null;

  const res = await axios.get(
    `https://text.pollinations.ai/${encodeURIComponent(lastUser.content)}`,
    {
      timeout: 25000,
      params: {
        model: "openai",
        seed: Math.floor(Math.random() * 99999),
        system: system.substring(0, 200)
      },
      responseType: "text"
    }
  );
  const text = typeof res.data === "string" ? res.data.trim() : null;
  return text && text.length > 2 ? text : null;
}

// محاولة POST من pollinations (تدعم التاريخ الكامل)
async function askPollinationsPOST(messages) {
  const res = await axios.post("https://text.pollinations.ai/openai", {
    messages,
    model: "openai",
    seed: Math.floor(Math.random() * 99999)
  }, {
    timeout: 25000,
    headers: { "Content-Type": "application/json" }
  });
  return res.data?.choices?.[0]?.message?.content || null;
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!args[0]) {
    return api.sendMessage(
      `🤖 الذكاء الاصطناعي جاهز!\n\n• ذكاء {سؤالك} ← اسأل أي سؤال\n• ذكاء مسح ← مسح تاريخ محادثتك\n\nمثال: ذكاء ما هي عاصمة فرنسا؟`,
      threadID, messageID
    );
  }

  if (args[0] === "مسح" || args[0] === "حذف") {
    userHistories.delete(senderID);
    return api.sendMessage("🗑️ تم مسح تاريخ محادثتك بنجاح", threadID, messageID);
  }

  const userMessage = args.join(" ").trim();
  if (!userMessage) return;

  const history = userHistories.get(senderID) || [];
  history.push({ role: "user", content: userMessage });
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);

  const messages = [
    {
      role: "system",
      content: "أنت مساعد ذكي اسمك زينو. أجب دائماً باللغة العربية بشكل واضح ومختصر. إذا سألوك بلغة أخرى أجب بنفس اللغة."
    },
    ...history
  ];

  await api.sendMessage("⏳ جاري التفكير...", threadID, messageID);

  let reply = null;
  let provider = "";

  try {
    // 1. جرب Groq إذا عنده مفتاح
    if (process.env.GROQ_API_KEY) {
      try {
        reply = await askGroq(messages, process.env.GROQ_API_KEY);
        if (reply) provider = "Groq · Llama 3.3 70B";
      } catch (e) {}
    }

    // 2. جرب OpenAI إذا عنده مفتاح
    if (!reply && process.env.OPENAI_API_KEY) {
      try {
        reply = await askOpenAI(messages, process.env.OPENAI_API_KEY);
        if (reply) provider = "OpenAI · GPT-4o mini";
      } catch (e) {}
    }

    // 3. جرب Pollinations GET (الأسرع)
    if (!reply) {
      try {
        reply = await askPollinationsGET(messages);
        if (reply) provider = "Pollinations AI";
      } catch (e) {}
    }

    // 4. جرب Pollinations POST (fallback)
    if (!reply) {
      try {
        reply = await askPollinationsPOST(messages);
        if (reply) provider = "Pollinations AI";
      } catch (e) {}
    }

  } catch (e) {}

  if (!reply || reply.trim().length === 0) {
    return api.sendMessage(
      "❌ لم أتمكن من الاتصال بالذكاء الاصطناعي\nحاول مرة أخرى لاحقاً",
      threadID, messageID
    );
  }

  // حفظ الرد في التاريخ
  history[history.length - 1] = { role: "user", content: userMessage };
  history.push({ role: "assistant", content: reply });
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  userHistories.set(senderID, history);

  return api.sendMessage(
    `🤖 ${reply}\n\n─────────────\n⚡ ${provider}`,
    threadID, messageID
  );
};
