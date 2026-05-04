const axios = require("axios");
const fs = require("fs");
const path = require("path");

const TMP = path.join(__dirname, "cache");
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

module.exports.config = {
  name: "تيك",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "بحث وإرسال فيديو من تيك توك",
  commandCategory: "ميديا",
  usages: "تيك [موضوع البحث]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args[0]) {
    return api.sendMessage(
      `🎬 أمر تيك توك\n\nاكتب موضوع البحث بعد الأمر\nمثال: تيك مضحكة\nمثال: تيك رياضة\nمثال: تيك طبخ`,
      threadID, messageID
    );
  }

  const query = args.join(" ");
  await api.sendMessage(`🔍 جاري البحث عن: ${query}`, threadID, messageID);

  try {
    // بحث عن فيديوهات تيك توك عبر tikwm API
    const searchRes = await axios.get("https://www.tikwm.com/api/feed/search", {
      params: {
        keywords: query,
        count: 5,
        cursor: 0,
        HD: 0,
        web: 1
      },
      timeout: 20000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const videos = searchRes.data?.data?.videos;
    if (!videos || !videos.length) {
      return api.sendMessage("❌ ما لقيت فيديوهات لهذا البحث، جرب كلمة أخرى", threadID, messageID);
    }

    // اختر فيديو عشوائي من أول 5 نتائج
    const pick = videos[Math.floor(Math.random() * Math.min(videos.length, 5))];
    const videoUrl = pick.play || pick.wmplay;
    const title = pick.title || query;
    const author = pick.author?.nickname || "";

    if (!videoUrl) {
      return api.sendMessage("❌ تعذر الحصول على رابط الفيديو", threadID, messageID);
    }

    // تحميل الفيديو
    const outPath = path.join(TMP, `tiktok_${Date.now()}.mp4`);
    const videoRes = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      timeout: 40000,
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.tiktok.com/" }
    });
    fs.writeFileSync(outPath, Buffer.from(videoRes.data));

    // التحقق من حجم الملف
    const sizeMB = fs.statSync(outPath).size / 1024 / 1024;
    if (sizeMB > 25) {
      fs.unlinkSync(outPath);
      return api.sendMessage("❌ الفيديو كبير جداً (أكثر من 25MB)\nجرب بحثاً آخر", threadID, messageID);
    }

    await api.sendMessage(
      {
        body: `🎬 ${title}${author ? `\n👤 @${author}` : ""}`,
        attachment: fs.createReadStream(outPath)
      },
      threadID, messageID
    );

    setTimeout(() => { try { fs.unlinkSync(outPath); } catch (e) {} }, 15000);

  } catch (e) {
    console.error("[تيك]", e.message);
    return api.sendMessage(
      `❌ فشل التحميل\nحاول مع موضوع آخر أو حاول لاحقاً`,
      threadID, messageID
    );
  }
};
