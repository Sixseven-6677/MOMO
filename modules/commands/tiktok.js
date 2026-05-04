const axios = require("axios");
const fs = require("fs");
const path = require("path");

const TMP = path.join(__dirname, "cache");
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

module.exports.config = {
  name: "تيك",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "تحميل فيديو تيك توك بدون علامة مائية",
  commandCategory: "ميديا",
  usages: "تيك [رابط الفيديو]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  const url = args[0] || (event.messageReply?.body?.trim());
  if (!url || !url.includes("tiktok")) {
    return api.sendMessage(
      `🎬 أمر التيك توك\n\nأرسل رابط الفيديو بعد الأمر\nمثال: تيك https://vm.tiktok.com/xxx\n\nأو أرسل الرابط في رسالة وردّ عليها بـ: تيك`,
      threadID, messageID
    );
  }

  await api.sendMessage("⬇️ جاري تحميل الفيديو...", threadID, messageID);

  try {
    // API 1: tiklydown
    let videoUrl = null;
    let title = "فيديو تيك توك";

    try {
      const res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`, {
        timeout: 15000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (res.data?.video?.noWatermark) {
        videoUrl = res.data.video.noWatermark;
        title = res.data.title || title;
      }
    } catch (e1) {
      // fallback API
      try {
        const res2 = await axios.post("https://api.tmate.cc/api/download", { url }, {
          timeout: 15000,
          headers: { "Content-Type": "application/json" }
        });
        if (res2.data?.result?.video) {
          videoUrl = res2.data.result.video;
          title = res2.data.result.title || title;
        }
      } catch (e2) {}
    }

    if (!videoUrl) {
      return api.sendMessage(
        "❌ فشل تحميل الفيديو\nتأكد أن الرابط صحيح وحاول مجدداً",
        threadID, messageID
      );
    }

    // تحميل الفيديو
    const outPath = path.join(TMP, `tiktok_${Date.now()}.mp4`);
    const videoRes = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    fs.writeFileSync(outPath, Buffer.from(videoRes.data));

    await api.sendMessage(
      {
        body: `🎬 ${title}`,
        attachment: fs.createReadStream(outPath)
      },
      threadID, messageID
    );

    setTimeout(() => { try { fs.unlinkSync(outPath); } catch (e) {} }, 15000);

  } catch (e) {
    console.error("[تيك]", e.message);
    return api.sendMessage("❌ حدث خطأ أثناء التحميل\nحاول مجدداً لاحقاً", threadID, messageID);
  }
};
