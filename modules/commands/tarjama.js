const https = require("https");

function translate(text, from, to) {
  return new Promise((resolve, reject) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    https.get(url, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const result = parsed[0].map(s => s[0]).join("");
          resolve(result);
        } catch(e) { reject(e); }
      });
    }).on("error", reject);
  });
}

const langNames = {
  ar: "العربية", en: "الإنجليزية", fr: "الفرنسية", de: "الألمانية",
  es: "الإسبانية", tr: "التركية", ru: "الروسية", zh: "الصينية",
  ja: "اليابانية", ko: "الكورية", it: "الإيطالية", pt: "البرتغالية",
  fa: "الفارسية", ur: "الأردية", hi: "الهندية"
};

module.exports.config = {
  name: "ترجمة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "ترجمة النصوص لأي لغة",
  commandCategory: "الترفيه",
  usages: "ترجمة [نص] | ترجمة [كود اللغة] [نص] | رد على رسالة + ترجمة",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, messageReply } = event;

  let toLang = "ar";
  let text    = "";

  // رد على رسالة
  if (messageReply && messageReply.body) {
    text = messageReply.body.trim();
    if (args[0] && langNames[args[0]]) toLang = args[0];
  } else {
    // أول arg لغة؟
    if (args[0] && langNames[args[0]]) {
      toLang = args.shift();
    }
    text = args.join(" ").trim();
  }

  if (!text)
    return api.sendMessage(
      `❌ الاستخدام:\n• ترجمة [نص] ← للعربية\n• ترجمة [كود] [نص] ← لغة محددة\n• رد على رسالة + ترجمة\n\nأكواد اللغات:\n${Object.entries(langNames).map(([k,v])=>`${k}=${v}`).join(" | ")}`,
      threadID, messageID
    );

  try {
    const translated = await translate(text, "auto", toLang);
    return api.sendMessage(
      `🌍 الترجمة إلى ${langNames[toLang] || toLang}:\n━━━━━━━━━━━━━━\n${translated}`,
      threadID, messageID
    );
  } catch (e) {
    return api.sendMessage("❌ فشلت الترجمة، حاول مرة ثانية", threadID, messageID);
  }
};
