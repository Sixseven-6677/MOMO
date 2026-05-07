const axios = require("axios");
const fs    = require("fs");
const path  = require("path");

const TMP = path.join(__dirname, "cache");
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

module.exports.config = {
  name:            "تيك",
  version:         "4.0.0",
  hasPermssion:    0,
  credits:         "MOMO",
  description:     "بحث وإرسال فيديو من تيك توك",
  commandCategory: "ميديا",
  usages:          "تيك [موضوع البحث]",
  cooldowns:       10
};

// ── البحث عبر tikwm ─────────────────────────────────────────────
async function searchTikwm(query) {
  const res = await axios.get("https://www.tikwm.com/api/feed/search", {
    params: { keywords: query, count: 10, cursor: 0, HD: 0, web: 1 },
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36",
      "Referer":    "https://www.tikwm.com/"
    }
  });
  const videos = res.data?.data?.videos;
  if (!videos?.length) return null;
  const pick = videos[Math.floor(Math.random() * Math.min(videos.length, 5))];
  return {
    url:         pick.play   || null,
    urlFallback: pick.wmplay || null,
    title:       pick.title  || query,
    author:      pick.author?.nickname || ""
  };
}

// ── تحميل الفيديو من URL ─────────────────────────────────────────
async function downloadVideo(url) {
  const outPath = path.join(TMP, `tiktok_${Date.now()}.mp4`);
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 60000,
    maxContentLength: 50 * 1024 * 1024,
    headers: {
      "User-Agent":      "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36",
      "Referer":         "https://www.tiktok.com/",
      "Accept":          "video/mp4,video/*;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5"
    }
  });
  const buf = Buffer.from(res.data);
  if (buf.length < 10000) throw new Error("ملف صغير جداً — ليس فيديو");
  fs.writeFileSync(outPath, buf);
  return outPath;
}

// ── محاولة عبر ssstik ────────────────────────────────────────────
async function searchSsstik(query) {
  // البحث أولاً بكلمات إنجليزية
  const res = await axios.get(`https://api.tiklydown.eu.org/api/search`, {
    params: { query, count: 5 },
    timeout: 10000,
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const items = res.data?.data || res.data?.videos || res.data;
  if (!Array.isArray(items) || !items.length) return null;
  const pick = items[0];
  return {
    url:         pick.play || pick.video || pick.url || null,
    urlFallback: pick.wmplay || null,
    title:       pick.title || query,
    author:      pick.author || ""
  };
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args[0]) {
    return api.sendMessage(
      `🎬 أمر تيك توك\n\nاكتب موضوع البحث بعد الأمر\nمثال: تيك مضحكة\nمثال: تيك رياضة\nمثال: تيك طبخ`,
      threadID, messageID
    );
  }

  const query = args.join(" ").trim();
  await api.sendMessage(`🔍 جاري البحث عن: ${query}`, threadID, messageID);

  let info   = null;

  // محاولة 1: tikwm
  try { info = await searchTikwm(query); } catch (e) {}

  // محاولة 2: ssstik/tiklydown
  if (!info || !info.url) {
    try { info = await searchSsstik(query); } catch (e) {}
  }

  if (!info || !info.url) {
    return api.sendMessage(
      `❌ ما لقيت فيديو لـ "${query}"\n\nجرب:\n• كلمات إنجليزية (funny, dance, food)\n• كلمات أقصر وأبسط`,
      threadID, messageID
    );
  }

  let outPath = null;
  // محاولة التحميل من الرابط الأساسي
  try { outPath = await downloadVideo(info.url); } catch (e) {}

  // محاولة الرابط الاحتياطي (بدون ووترمارك)
  if (!outPath && info.urlFallback) {
    try { outPath = await downloadVideo(info.urlFallback); } catch (e) {}
  }

  if (!outPath) {
    return api.sendMessage(
      `❌ لقيت الفيديو لكن فشل التحميل\nجرب موضوع آخر`,
      threadID, messageID
    );
  }

  const sizeMB = fs.statSync(outPath).size / 1024 / 1024;
  if (sizeMB > 25) {
    fs.unlinkSync(outPath);
    return api.sendMessage("❌ الفيديو كبير جداً (+25MB)\nجرب موضوع آخر", threadID, messageID);
  }

  try {
    await api.sendMessage(
      {
        body:       `🎬 ${info.title}${info.author ? `\n👤 @${info.author}` : ""}`,
        attachment: fs.createReadStream(outPath)
      },
      threadID, messageID
    );
  } catch (e) {
    return api.sendMessage("❌ فشل إرسال الفيديو: " + e.message, threadID, messageID);
  } finally {
    setTimeout(() => { try { fs.unlinkSync(outPath); } catch (e) {} }, 15000);
  }
};
