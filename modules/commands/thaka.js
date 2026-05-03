const https = require("https");

const userHistories = new Map();
const MAX_HISTORY = 10;

module.exports.config = {
  name: "ذكاء",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "ذكاء اصطناعي متقدم يجيب على أسئلتك ويتذكر المحادثة",
  commandCategory: "أوامر",
  usages: "ذكاء {سؤالك} | ذكاء مسح",
  cooldowns: 3
};

function httpsPost(options, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({ ...options, headers: { ...options.headers, "Content-Length": Buffer.byteLength(data) } }, res => {
      let out = "";
      res.on("data", c => out += c);
      res.on("end", () => { try { resolve(JSON.parse(out)); } catch { resolve(out); } });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function askGroq(messages, apiKey) {
  const result = await httpsPost({
    hostname: "api.groq.com",
    path: "/openai/v1/chat/completions",
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    }
  }, {
    model: "llama-3.3-70b-versatile",
    messages,
    max_tokens: 1024,
    temperature: 0.7
  });
  return result?.choices?.[0]?.message?.content || null;
}

async function askOpenAI(messages, apiKey) {
  const result = await httpsPost({
    hostname: "api.openai.com",
    path: "/v1/chat/completions",
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    }
  }, {
    model: "gpt-4o-mini",
    messages,
    max_tokens: 1024,
    temperature: 0.7
  });
  return result?.choices?.[0]?.message?.content || null;
}

async function askPollinations(messages) {
  const result = await httpsPost({
    hostname: "text.pollinations.ai",
    path: "/openai",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, {
    model: "openai",
    messages,
    seed: Math.floor(Math.random() * 99999)
  });
  if (typeof result === "string") return result;
  return result?.choices?.[0]?.message?.content || null;
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!args[0]) {
    return api.sendMessage(
      `🤖 الذكاء الاصطناعي جاهز!\n\n` +
      `• ذكاء {سؤالك} ← اسأل أي سؤال\n` +
      `• ذكاء مسح ← مسح تاريخ محادثتك\n\n` +
      `مثال: ذكاء ما هي عاصمة فرنسا؟`,
      threadID, messageID
    );
  }

  if (args[0] === "مسح") {
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
      content: "أنت مساعد ذكي واسمك زينو. أجب دائماً باللغة العربية بشكل واضح ومختصر. إذا سألوك بلغة أخرى أجب بنفس اللغة."
    },
    ...history
  ];

  await api.sendMessage("⏳ جاري التفكير...", threadID, messageID);

  let reply = null;
  let provider = "";

  try {
    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (groqKey) {
      reply = await askGroq(messages, groqKey);
      provider = "Groq · Llama 3.3 70B";
    } else if (openaiKey) {
      reply = await askOpenAI(messages, openaiKey);
      provider = "OpenAI · GPT-4o mini";
    }

    if (!reply) {
      reply = await askPollinations(messages);
      provider = "Pollinations AI";
    }
  } catch (e) {
    try {
      reply = await askPollinations(messages);
      provider = "Pollinations AI";
    } catch (e2) {
      return api.sendMessage("❌ فشل الاتصال بالذكاء الاصطناعي، حاول مرة أخرى لاحقاً", threadID, messageID);
    }
  }

  if (!reply) {
    return api.sendMessage("❌ لم يصل رد من الذكاء الاصطناعي، حاول مرة أخرى", threadID, messageID);
  }

  history[history.length - 1] = { role: "user", content: userMessage };
  history.push({ role: "assistant", content: reply });
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  userHistories.set(senderID, history);

  return api.sendMessage(
    `🤖 ${reply}\n\n─────────────\n⚡ ${provider}`,
    threadID, messageID
  );
};
