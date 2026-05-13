const axios = require("axios");
const fs    = require("fs");
const path  = require("path");

const TMP = path.join(__dirname, "cache");
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

module.exports.config = {
  name:            "تيك",
  version:         "5.0.0",
  hasPermssion:    0,
  credits:         "MOMO",
  description:     "بحث وإرسال فيديو من تيك توك",
  commandCategory: "ميديا",
  usages:          "تيك [موضوع البحث]",
  cooldowns:       10
};

async function searchTikwm(query) {
  const res = await axios.get("https://www.tikwm.com/api/feed/search", {
    params: { keywords: query, count: 10, cursor: 0, HD: 0, web: 1 },
    timeout: 12000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36",
      "Referer":    "https://www.tikwm.com/"
    }
  });
  const videos = res.data?.data?.videos;
  if (!Array.isArray(videos) || !videos.length) return null;
  const pick = videos[Math.floor(Math.random() * Math.min(videos.length, 5))];
  return {
    url:    pick.play   || null,
    backup: pick.wmplay || null,
    title:  pick.title  || query,
    author: pick.author?.nickname || ""
  };
}

async function searchTiklydown(query) {
  const res = await axios.get("https://api.tiklydown.eu.org/api/search", {
    params: { query, count: 5 },
    timeout: 10000,
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const items = res.data?.data || res.data?.videos;
  if (!Array.isArray(items) || !items.length) return null;
  const pick = items[0];
  return {
    url:    pick.play || pick.video || pick.url || null,
    backup: pick.wmplay || null,
    title:  pick.title || query,
    author: pick.author || ""
  };
}

async function downloadVideo(url) {
  const outPath = path.join(TMP, `tiktok_${Date.now()}.mp4`);
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 60000,
    maxContentLength: 50 * 1024 * 1024,
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36",
      "Referer":    "https://www.tiktok.com/",
      "Accept":     "video/mp4,video/*;q=0.9,*/*;q=0.8"
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
      `🎬 أمر تيك توك\n\nاكتب موضوع البحث بعد الأمر\nمثال: تيك مضحكة\nمثال: تيك Gojo edit`,
      threadID, messageID
    );
  }

  const query = args.join(" ");
  let waitMsgID = null;

  await new Promise(r => api.sendMessage(
    `🔍 جاري البحث عن: ${query}...`, threadID,
    (e, info) => { waitMsgID = info?.messageID; r(); }, messageID
  )).catch(() => {});

  try {
    // بحث — جرّب tikwm أولاً ثم tiklydown
    let video = null;
    try   { video = await searchTikwm(query); }     catch(e) {}
    if (!video) {
      try { video = await searchTiklydown(query); } catch(e) {}
    }

    if (!video || (!video.url && !video.backup)) {
      if (waitMsgID) { try { api.unsendMessage(waitMsgID); } catch(e) {} }
      return api.sendMessage(`❌ ما لقيت نتائج لـ "${query}"\nجرب كلمات إنجليزية أو موضوع آخر`, threadID, messageID);
    }

    // تحميل — جرّب الرابط الأول ثم الاحتياطي
    let outPath = null;
    const urlsToTry = [video.url, video.backup].filter(Boolean);

    for (const url of urlsToTry) {
      try { outPath = await downloadVideo(url); break; } catch(e) {}
    }

    if (!outPath) {
      if (waitMsgID) { try { api.unsendMessage(waitMsgID); } catch(e) {} }
      return api.sendMessage(`❌ تعذّر تحميل الفيديو\nحاول مع موضوع آخر`, threadID, messageID);
    }

    // إرسال
    await new Promise((resolve, reject) => {
      api.sendMessage(
        {
          body:       `🎬 ${video.title}\n👤 ${video.author}`,
          attachment: fs.createReadStream(outPath)
        },
        threadID,
        (err) => err ? reject(err) : resolve(),
        messageID
      );
    });

    setTimeout(() => { try { fs.unlinkSync(outPath); } catch(e) {} }, 15000);
    if (waitMsgID) { try { api.unsendMessage(waitMsgID); } catch(e) {} }

  } catch(e) {
    console.error("[تيك]", e.message);
    if (waitMsgID) { try { api.unsendMessage(waitMsgID); } catch(ex) {} }
    return api.sendMessage(`❌ فشل تحميل الفيديو\nحاول لاحقاً أو جرب موضوعاً آخر`, threadID, messageID);
  }
};
