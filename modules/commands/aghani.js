const axios = require("axios");
const fs    = require("fs");
const path  = require("path");

const TMP = path.join(__dirname, "cache");
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

module.exports.config = {
  name:            "أغاني",
  version:         "3.0.0",
  hasPermssion:    0,
  credits:         "MOMO",
  description:     "بحث وإرسال أغنية صوتية من يوتيوب",
  commandCategory: "ميديا",
  usages:          "أغاني [اسم الأغنية]",
  cooldowns:       15
};

// ── بحث عبر Invidious (بدون مفتاح API) ───────────────────────────────────
const INVIDIOUS = [
  "https://invidious.snopyta.org",
  "https://inv.riverside.rocks",
  "https://invidious.kavin.rocks",
  "https://yt.artemislena.eu",
  "https://invidious.nerdvpn.de"
];

async function searchYouTube(query) {
  for (const host of INVIDIOUS) {
    try {
      const res = await axios.get(`${host}/api/v1/search`, {
        params: { q: query, type: "video", fields: "videoId,title,lengthSeconds,author" },
        timeout: 8000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        const v = res.data[0];
        return { id: v.videoId, title: v.title || query, author: v.author || "", length: v.lengthSeconds || 0 };
      }
    } catch(e) {}
  }
  return null;
}

// ── تحميل صوت عبر cobalt.tools (مجاني، بدون مفتاح) ──────────────────────
async function getAudioUrl(videoId) {
  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // محاولة 1: cobalt.tools API
  try {
    const res = await axios.post(
      "https://api.cobalt.tools/",
      { url: ytUrl, isAudioOnly: true, audioFormat: "mp3", downloadMode: "audio" },
      {
        timeout: 20000,
        headers: {
          "Accept":       "application/json",
          "Content-Type": "application/json",
          "User-Agent":   "MOMO-Bot/3.0"
        }
      }
    );
    const d = res.data;
    if ((d.status === "stream" || d.status === "redirect" || d.status === "tunnel") && d.url) {
      return d.url;
    }
  } catch(e) {}

  // محاولة 2: noembed للتحقق + yt-search-api بديل
  try {
    const res = await axios.post(
      "https://co.wuk.sh/api/json",
      { url: ytUrl, isAudioOnly: "true", aFormat: "mp3" },
      {
        timeout: 15000,
        headers: { "Accept": "application/json", "Content-Type": "application/json" }
      }
    );
    if (res.data?.url) return res.data.url;
  } catch(e) {}

  return null;
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args[0]) {
    return api.sendMessage(
      `🎵 أمر الأغاني\n\nاكتب اسم الأغنية بعد الأمر\nمثال: أغاني عمر خيرة\nمثال: أغاني حمزة نمرة`,
      threadID, messageID
    );
  }

  const query = args.join(" ");
  let waitMsgID = null;

  try {
    await new Promise(r => api.sendMessage(`🔍 جاري البحث عن: ${query}...`, threadID, (e, info) => { waitMsgID = info?.messageID; r(); }, messageID));
  } catch(e) {}

  try {
    // ── 1. بحث عن الفيديو ──
    const video = await searchYouTube(query);
    if (!video) return api.sendMessage("❌ ما لقيت نتائج لهذا البحث، جرب كلمات أخرى", threadID, messageID);

    const mins = Math.floor(video.length / 60);
    const secs = video.length % 60;
    const durStr = video.length > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : "؟";

    // تجاهل الفيديوهات الطويلة جداً (أكثر من 10 دقائق)
    if (video.length > 600) {
      return api.sendMessage(
        `❌ الفيديو طويل جداً (${durStr})\nجرب أغنية أقصر (حد أقصى 10 دقائق)`,
        threadID, messageID
      );
    }

    // ── 2. الحصول على رابط الصوت ──
    const audioUrl = await getAudioUrl(video.id);
    if (!audioUrl) {
      return api.sendMessage(
        `❌ تعذر تحميل: "${video.title}"\nحاول لاحقاً أو جرب اسم أغنية مختلف`,
        threadID, messageID
      );
    }

    // ── 3. تحميل الصوت ──
    const outPath = path.join(TMP, `song_${Date.now()}.mp3`);
    const dlRes = await axios.get(audioUrl, {
      responseType: "arraybuffer",
      timeout: 90000,
      maxContentLength: 25 * 1024 * 1024,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept":     "audio/*,*/*"
      }
    });

    const buf = Buffer.from(dlRes.data);
    if (buf.length < 5000) throw new Error("الملف المحمل صغير جداً");
    fs.writeFileSync(outPath, buf);

    // ── 4. إرسال الملف ──
    await new Promise((resolve, reject) => {
      api.sendMessage(
        {
          body:       `🎵 ${video.title}\n🎤 ${video.author}\n⏱ ${durStr}`,
          attachment: fs.createReadStream(outPath)
        },
        threadID,
        (err) => err ? reject(err) : resolve(),
        messageID
      );
    });

    // تنظيف الملف المؤقت
    setTimeout(() => { try { fs.unlinkSync(outPath); } catch(e) {} }, 15000);

    // حذف رسالة "جاري البحث"
    if (waitMsgID) { try { api.unsendMessage(waitMsgID); } catch(e) {} }

  } catch(e) {
    console.error("[أغاني]", e.message);
    return api.sendMessage(`❌ فشل تحميل الأغنية\nحاول مع اسم آخر أو لاحقاً`, threadID, messageID);
  }
};
