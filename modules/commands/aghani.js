const YoutubeSearchApi = require("youtube-search-api");
const ytdl = require("@distube/ytdl-core");
const fs   = require("fs");
const path = require("path");

const TMP = path.join(__dirname, "cache");
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

module.exports.config = {
  name:            "أغاني",
  version:         "4.0.0",
  hasPermssion:    0,
  credits:         "MOMO",
  description:     "بحث وإرسال أغنية صوتية من يوتيوب مباشرةً",
  commandCategory: "ميديا",
  usages:          "أغاني [اسم الأغنية]",
  cooldowns:       15
};

function parseLength(simpleText) {
  if (!simpleText) return 0;
  const parts = String(simpleText).split(":").map(Number);
  if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
  if (parts.length === 2) return parts[0]*60 + parts[1];
  return 0;
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

  await new Promise(r => api.sendMessage(
    `🔍 جاري البحث عن: ${query}...`, threadID,
    (e, info) => { waitMsgID = info?.messageID; r(); }, messageID
  )).catch(() => {});

  try {
    // 1. بحث في يوتيوب
    const results = await YoutubeSearchApi.GetListByKeyword(query, false, 8, [{ type: "video" }]);
    const items   = results?.items || [];

    if (!items.length) {
      return api.sendMessage("❌ ما لقيت نتائج لهذا البحث، جرب كلمات أخرى", threadID, messageID);
    }

    // 2. اختر أول فيديو مناسب (أقل من 10 دقائق)
    let video = null;
    for (const item of items) {
      const len = parseLength(item.length?.simpleText);
      if (len > 0 && len <= 600) {
        video = { id: item.id, title: item.title || query, lengthText: item.length?.simpleText || "؟", length: len };
        break;
      }
    }

    if (!video) {
      return api.sendMessage("❌ الأغاني الموجودة طويلة جداً (أكثر من 10 دقائق)\nجرب اسم أغنية أقصر", threadID, messageID);
    }

    const ytUrl  = `https://www.youtube.com/watch?v=${video.id}`;
    const outPath = path.join(TMP, `song_${Date.now()}.mp3`);

    // 3. تحميل الصوت مباشرة من يوتيوب
    await new Promise((resolve, reject) => {
      const stream = ytdl(ytUrl, { filter: "audioonly", quality: "lowestaudio" });
      const out    = fs.createWriteStream(outPath);
      stream.pipe(out);
      stream.on("error", reject);
      out.on("finish", resolve);
      out.on("error", reject);
      const timer = setTimeout(() => { stream.destroy(); reject(new Error("timeout")); }, 120000);
      out.on("finish", () => clearTimeout(timer));
    });

    const stat = fs.statSync(outPath);
    if (stat.size < 5000) throw new Error("الملف المحمل صغير جداً");

    // 4. إرسال الملف
    await new Promise((resolve, reject) => {
      api.sendMessage(
        { body: `🎵 ${video.title}\n⏱ ${video.lengthText}`, attachment: fs.createReadStream(outPath) },
        threadID,
        (err) => err ? reject(err) : resolve(),
        messageID
      );
    });

    // تنظيف
    setTimeout(() => { try { fs.unlinkSync(outPath); } catch(e) {} }, 15000);
    if (waitMsgID) { try { api.unsendMessage(waitMsgID); } catch(e) {} }

  } catch(e) {
    console.error("[أغاني]", e.message);
    return api.sendMessage("❌ فشل تحميل الأغنية\nحاول مع اسم آخر أو لاحقاً", threadID, messageID);
  }
};
