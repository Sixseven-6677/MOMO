const https = require("https");
const http  = require("http");
const { createWriteStream, unlinkSync, existsSync } = require("fs");
const { join } = require("path");
const { Readable } = require("stream");

function downloadAudio(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://www.google.com"
      }
    }, res => {
      if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode));
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", err => { file.close(); reject(err); });
  });
}

module.exports.config = {
  name: "صوت",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "تحويل النص إلى رسالة صوتية",
  commandCategory: "الترفيه",
  usages: "صوت [النص] | صوت [كود اللغة] [النص]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, messageReply } = event;

  const langMap = { ar:"ar", en:"en", fr:"fr", de:"de", es:"es", tr:"tr" };
  let lang = "ar";
  let text = "";

  if (messageReply && messageReply.body) {
    text = messageReply.body.trim();
    if (args[0] && langMap[args[0]]) lang = args[0];
  } else {
    if (args[0] && langMap[args[0]]) lang = args.shift();
    text = args.join(" ").trim();
  }

  if (!text)
    return api.sendMessage(
      "❌ الاستخدام:\n• صوت [نص]\n• صوت [كود اللغة] [نص]\n• رد على رسالة + صوت\n\nأكواد: ar en fr de es tr",
      threadID, messageID
    );

  if (text.length > 200)
    return api.sendMessage("❌ النص طويل جداً (الحد 200 حرف)", threadID, messageID);

  const tmpFile = join(__dirname, `cache/tts_${Date.now()}.mp3`);

  try {
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;
    await downloadAudio(ttsUrl, tmpFile);

    const { createReadStream } = require("fs");
    await new Promise((res, rej) => {
      api.sendMessage(
        { attachment: createReadStream(tmpFile) },
        threadID,
        (err) => { err ? rej(err) : res(); },
        messageID
      );
    });
  } catch (e) {
    return api.sendMessage("❌ فشل تحويل النص لصوت، حاول مجدداً", threadID, messageID);
  } finally {
    try { if (existsSync(tmpFile)) unlinkSync(tmpFile); } catch(e) {}
  }
};
