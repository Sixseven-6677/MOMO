const axios = require("axios");

const userHistories = new Map();
const MAX_HISTORY   = 10;

module.exports.config = {
  name:            "ذكاء",
  version:         "5.0.0",
  hasPermssion:    0,
  credits:         "MOMO",
  description:     "ذكاء اصطناعي يجيب على أسئلتك ويتذكر المحادثة",
  commandCategory: "أوامر",
  usages:          "ذكاء {سؤالك} | ذكاء مسح",
  cooldowns:       3
};

const SYSTEM_PROMPT = "أنت مساعد ذكي اسمك زينو. أجب دائماً باللغة العربية بشكل واضح ومختصر ما لم يتحدث المستخدم بلغة أخرى.";

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, r) => setTimeout(() => r(new Error("timeout")), ms))
  ]);
}

async function askPollinationsPOST(messages) {
  const res = await axios.post(
    "https://text.pollinations.ai/openai",
    { messages, model: "openai-large", seed: Math.floor(Math.random() * 99999) },
    { timeout: 12000, headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" } }
  );
  const text = res.data?.choices?.[0]?.message?.content?.trim();
  return (text && text.length > 3) ? text : null;
}

async function askPollinationsGET(question) {
  const url = `https://text.pollinations.ai/${encodeURIComponent(question)}?model=openai&seed=${Math.floor(Math.random()*99999)}`;
  const res = await axios.get(url, {
    timeout: 12000,
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "text/plain" },
    responseType: "text"
  });
  const text = typeof res.data === "string" ? res.data.trim() : String(res.data).trim();
  return (text && text.length > 3 && !text.startsWith("{")) ? text : null;
}

async function askGroq(messages) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    { model: "llama-3.3-70b-versatile", messages, max_tokens: 1024, temperature: 0.7 },
    { timeout: 12000, headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" } }
  );
  return res.data?.choices?.[0]?.message?.content?.trim() || null;
}

async function askOpenAI(messages) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    { model: "gpt-4o-mini", messages, max_tokens: 1024, temperature: 0.7 },
    { timeout: 12000, headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" } }
  );
  return res.data?.choices?.[0]?.message?.content?.trim() || null;
}

async function askGemini(question) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    { contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\n" + question }] }] },
    { timeout: 12000, headers: { "Content-Type": "application/json" } }
  );
  return res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

async function tryAll(messages, question) {
  // Run all providers in parallel — return the first one that answers
  const providers = [
    { name: "Groq · Llama 3",     fn: () => askGroq(messages) },
    { name: "OpenAI · GPT-4o",    fn: () => askOpenAI(messages) },
    { name: "Gemini Flash",        fn: () => askGemini(question) },
    { name: "Pollinations POST",   fn: () => askPollinationsPOST(messages) },
    { name: "Pollinations GET",    fn: () => askPollinationsGET(question) },
  ];

  return new Promise((resolve) => {
    let remaining = providers.length;
    let resolved  = false;

    for (const p of providers) {
      withTimeout(p.fn(), 13000)
        .then(text => {
          if (!resolved && text && text.trim().length > 3) {
            resolved = true;
            resolve({ text: text.trim(), provider: p.name });
          }
        })
        .catch(() => {})
        .finally(() => {
          remaining--;
          if (!resolved && remaining === 0) {
            resolve(null);
          }
        });
    }
  });
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!args[0]) {
    return api.sendMessage(
      `🤖 الذكاء الاصطناعي جاهز!\n\n• ذكاء {سؤالك} ← اسأل أي سؤال\n• ذكاء مسح ← مسح تاريخ محادثتك\n\nمثال: ذكاء ما هي عاصمة فرنسا؟`,
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

  // أرسل رسالة الانتظار
  let waitMsgID = null;
  await new Promise(r => api.sendMessage(
    "⏳ جاري التفكير...", threadID,
    (e, info) => { waitMsgID = info?.messageID; r(); }, messageID
  )).catch(() => {});

  const result = await tryAll(messages, userMessage);

  if (waitMsgID) { try { api.unsendMessage(waitMsgID); } catch(e) {} }

  if (!result) {
    return api.sendMessage(
      "❌ لم أتمكن من الاتصال بالذكاء الاصطناعي الآن\nحاول مجدداً بعد قليل",
      threadID, messageID
    );
  }

  history.push({ role: "assistant", content: result.text });
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  userHistories.set(senderID, history);

  return api.sendMessage(
    `🤖 ${result.text}\n\n─────────────\n⚡ ${result.provider}`,
    threadID, messageID
  );
};
