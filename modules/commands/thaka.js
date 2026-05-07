const axios = require("axios");

const userHistories = new Map();
const MAX_HISTORY   = 10;

module.exports.config = {
  name:            "ذكاء",
  version:         "4.0.0",
  hasPermssion:    0,
  credits:         "MOMO",
  description:     "ذكاء اصطناعي يجيب على أسئلتك ويتذكر المحادثة",
  commandCategory: "أوامر",
  usages:          "ذكاء {سؤالك} | ذكاء مسح",
  cooldowns:       3
};

const SYSTEM_PROMPT =
  "أنت مساعد ذكي اسمك زينو. أجب دائماً باللغة العربية بشكل واضح ومختصر ما لم يتحدث المستخدم بلغة أخرى.";

// ── 1) Pollinations AI — POST ────────────────────────────────────
async function askPollinationsPOST(messages) {
  const res = await axios.post(
    "https://text.pollinations.ai/openai",
    { messages, model: "openai-large", seed: Math.floor(Math.random() * 99999) },
    {
      timeout: 30000,
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" }
    }
  );
  const text = res.data?.choices?.[0]?.message?.content?.trim();
  return text && text.length > 3 ? text : null;
}

// ── 2) Pollinations AI — GET (بدون مفتاح) ───────────────────────
async function askPollinationsGET(question) {
  const url = `https://text.pollinations.ai/${encodeURIComponent(question)}`;
  const res = await axios.get(url, {
    timeout: 25000,
    params: {
      model: "openai",
      seed: Math.floor(Math.random() * 99999),
      system: SYSTEM_PROMPT.substring(0, 200)
    },
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "text/plain" },
    responseType: "text"
  });
  const text = typeof res.data === "string" ? res.data.trim() : String(res.data).trim();
  if (text && text.length > 3 && !text.startsWith("{")) return text;
  return null;
}

// ── 3) Groq (مجاني مع مفتاح) ─────────────────────────────────────
async function askGroq(messages) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    { model: "llama-3.3-70b-versatile", messages, max_tokens: 1024, temperature: 0.7 },
    { timeout: 20000, headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" } }
  );
  return res.data?.choices?.[0]?.message?.content?.trim() || null;
}

// ── 4) OpenAI (مع مفتاح) ────────────────────────────────────────
async function askOpenAI(messages) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    { model: "gpt-4o-mini", messages, max_tokens: 1024, temperature: 0.7 },
    { timeout: 20000, headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" } }
  );
  return res.data?.choices?.[0]?.message?.content?.trim() || null;
}

// ── 5) DuckDuckGo AI ─────────────────────────────────────────────
async function askDuckDuckGo(question) {
  try {
    const status = await axios.get("https://duckduckgo.com/duckchat/v1/status", {
      headers: {
        "User-Agent":    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "x-vqd-accept":  "1",
        "Accept":        "application/json"
      },
      timeout: 10000
    });
    const token = status.headers["x-vqd-4"];
    if (!token) return null;

    const res = await axios.post(
      "https://duckduckgo.com/duckchat/v1/chat",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: question }
        ]
      },
      {
        timeout: 25000,
        headers: {
          "User-Agent":   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Content-Type": "application/json",
          "x-vqd-4":      token,
          "Accept":       "text/event-stream"
        },
        responseType: "text"
      }
    );

    const lines = String(res.data).split("\n");
    let fullText = "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const chunk = line.slice(6).trim();
      if (chunk === "[DONE]") break;
      try {
        const obj = JSON.parse(chunk);
        const delta = obj?.message || obj?.choices?.[0]?.delta?.content || "";
        fullText += delta;
      } catch (e) {}
    }
    return fullText.trim() || null;
  } catch (e) {
    return null;
  }
}

// ── 6) Gemini بديل مجاني ─────────────────────────────────────────
async function askGeminiFree(question) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\nسؤال المستخدم: " + question }] }]
    },
    { timeout: 20000, headers: { "Content-Type": "application/json" } }
  );
  return res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

module.exports.run = async function ({ api, event, args }) {
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

  if (args[0] === "مسح" || args[0] === "حذف") {
    userHistories.delete(senderID);
    return api.sendMessage("🗑️ تم مسح تاريخ محادثتك", threadID, messageID);
  }

  const userMessage = args.join(" ").trim();
  const history     = userHistories.get(senderID) || [];
  history.push({ role: "user", content: userMessage });
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);

  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...history];

  const waitMsg = await api.sendMessage("⏳ جاري التفكير...", threadID, messageID);

  let reply    = null;
  let provider = "";

  const tries = [
    async () => { const r = await askGroq(messages);             if (r) { provider = "Groq · Llama 3.3 70B";    return r; } },
    async () => { const r = await askOpenAI(messages);           if (r) { provider = "OpenAI · GPT-4o mini";    return r; } },
    async () => { const r = await askGeminiFree(userMessage);    if (r) { provider = "Google Gemini";           return r; } },
    async () => { const r = await askPollinationsPOST(messages); if (r) { provider = "Pollinations · GPT Large"; return r; } },
    async () => { const r = await askPollinationsGET(userMessage);if(r) { provider = "Pollinations AI";         return r; } },
    async () => { const r = await askDuckDuckGo(userMessage);    if (r) { provider = "DuckDuckGo AI";          return r; } }
  ];

  for (const tryFn of tries) {
    try { reply = await tryFn(); } catch (e) {}
    if (reply) break;
  }

  try { api.unsendMessage(waitMsg.messageID); } catch (e) {}

  if (!reply || reply.trim().length === 0) {
    return api.sendMessage(
      "❌ لم أتمكن من الاتصال بالذكاء الاصطناعي الآن\nحاول مجدداً بعد قليل",
      threadID, messageID
    );
  }

  history.push({ role: "assistant", content: reply });
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  userHistories.set(senderID, history);

  return api.sendMessage(
    `🤖 ${reply}\n\n─────────────\n⚡ ${provider}`,
    threadID, messageID
  );
};
