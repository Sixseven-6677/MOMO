const axios = require("axios");
const fs    = require("fs");
const path  = require("path");

const TMP = path.join(__dirname, "cache");
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

module.exports.config = {
  name:            "تيك",
  version:         "3.0.0",
  hasPermssion:    0,
  credits:         "MOMO",
  description:     "بحث وإرسال فيديو من تيك توك",
  commandCategory: "ميديا",
  usages:          "تيك [موضوع البحث]",
  cooldowns:       10
};

// ── محاولة البحث عبر tikwm ────────────────────────────────────────────────
async function searchTikwm(query) {
  const res = await axios.get("https://www.tikwm.com/api/feed/search", {
    params: { keywords: query, count: 10, cursor: 0, HD: 0, web: 1 },
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36",
      "Referer":    "https://www.tikwm.com/"
    }
  });
  const videos = res.data?.data?.videos;
  if (!videos?.length) return null;
  // اختر فيديو عشوائي من أول 5
  const pick = videos[Math.floor(Math.random() * Math.min(videos.length, 5))];
  return {
    url:    pick.play || pick.wmplay || null,
    title:  pick.title || query,
    author: pick.author?.nickname || ""
  };
}

// ── محاولة بديلة عبر tiklydown ───────────────────────────────────────────
async function searchTiklydown(query) {
  // بحث عبر Google لرابط تيك توك ثم تحميله
  const searchRes = await axios.get("https://www.googleapis.com/customsearch/v1", {
    params: {
      q:   `site:tiktok.com ${query}`,
      key: "AIzaSyDummy",  // placeholder
      cx:  "dummy"
    },
    timeout: 5000
  });
  return null; // بدون API key لن يعمل
}

// ── محاولة بديلة ثانية عبر musicaldown ──────────────────────────────────
async function fetchFromMusicaldown(query) {
  const searchRes = await axios.post(
    "https://api.musicaldown.com/url",
    `id=${encodeURIComponent("https://www.tiktok.com/tag/" + encodeURIComponent(query))}&lang=1`,
    {
      timeout: 12000,
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
        "User-Agent":    "Mozilla/5.0",
        "Referer":       "https://musicaldown.com/"
      }
    }
  );
  return null;
}

// ── تحميل الفيديو من URL ─────────────────────────────────────────────────
async function downloadVideo(url) {
  const outPath = path.join(TMP, `tiktok_${Date.now()}.mp4`);
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 45000,
    maxContentLength: 30 * 1024 * 1024,
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36",
      "Referer":    "https://www.tiktok.com/"
    }
  });
  const buf = Buffer.from(res.data);
  if (buf.length < 10000) throw new Error("ملف صغير جداً — ليس فيديو");
  fs.writeFileSync(outPath, buf);
  return outPath;
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
  const searching = await api.sendMessage(`🔍 جاري البحث عن: ${query}`, threadID, messageID);

  let info   = null;
  let errMsg = "";

  // محاولة 1: tikwm
  try {
    info = await searchTikwm(query);
  } catch (e) {
    errMsg = e.message;
  }

  if (!info || !info.url) {
    return api.sendMessage(
      `❌ ما لقيت فيديو لـ "${query}"\n\nجرب:\n• كلمات إنجليزية (funny, dance, food)\n• كلمات أقصر وأبسط`,
      threadID, messageID
    );
  }

  // حاول التحميل
  let outPath = null;
  try {
    outPath = await downloadVideo(info.url);
  } catch (e) {
    // جرب wmplay إذا فشل play
    if (info.urlFallback) {
      try { outPath = await downloadVideo(info.urlFallback); } catch (e2) {}
    }
    if (!outPath) {
      return api.sendMessage(
        `❌ لقيت الفيديو لكن فشل التحميل\nجرب موضوع آخر`,
        threadID, messageID
      );
    }
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
