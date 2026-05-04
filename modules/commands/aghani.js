const ytdl = require("@distube/ytdl-core");
const YoutubeSearchApi = require("youtube-search-api");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);

const TMP = path.join(__dirname, "cache");
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

module.exports.config = {
  name: "أغاني",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "بحث وإرسال أغنية صوتية من يوتيوب",
  commandCategory: "ميديا",
  usages: "أغاني [اسم الأغنية]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args[0]) {
    return api.sendMessage(
      `🎵 أمر الأغاني\n\nاكتب اسم الأغنية بعد الأمر\nمثال: أغاني عمر خيرة`,
      threadID, messageID
    );
  }

  const query = args.join(" ");
  await api.sendMessage(`🔍 جاري البحث عن: ${query}`, threadID, messageID);

  try {
    // البحث على يوتيوب
    const results = await YoutubeSearchApi.GetListByKeyword(query, false, 5);
    const videos = (results.items || []).filter(v => v.id && v.type !== "playlist");
    if (!videos.length) return api.sendMessage("❌ ما لقيت نتائج لهذا البحث", threadID, messageID);

    const video = videos[0];
    const videoId = video.id;
    const title = video.title || query;
    const duration = video.length?.simpleText || "؟";
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    await api.sendMessage(`🎵 ${title}\n⏱ المدة: ${duration}\n⬇️ جاري التحميل...`, threadID, messageID);

    const outPath = path.join(TMP, `song_${Date.now()}.mp3`);

    // تحميل وتحويل إلى MP3
    await new Promise((resolve, reject) => {
      const stream = ytdl(url, {
        quality: "highestaudio",
        filter: "audioonly",
        requestOptions: { headers: { "User-Agent": "Mozilla/5.0" } }
      });
      ffmpeg(stream)
        .audioBitrate(128)
        .toFormat("mp3")
        .save(outPath)
        .on("end", resolve)
        .on("error", reject);
    });

    await api.sendMessage(
      {
        body: `🎵 ${title}\n⏱ ${duration}`,
        attachment: fs.createReadStream(outPath)
      },
      threadID, messageID
    );

    // حذف الملف المؤقت
    setTimeout(() => { try { fs.unlinkSync(outPath); } catch (e) {} }, 10000);

  } catch (e) {
    console.error("[أغاني]", e.message);
    return api.sendMessage(
      `❌ فشل التحميل\n${e.message?.includes("unavailable") ? "الفيديو غير متاح" : "حاول مع اسم آخر"}`,
      threadID, messageID
    );
  }
};
