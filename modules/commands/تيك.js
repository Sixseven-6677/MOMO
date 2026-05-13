const fs   = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "تيك",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "FANG",
  description: "تحميل فيديو من تيك توك بدون علامة مائية",
  commandCategory: "ترفيه",
  usages: "تيك [رابط الفيديو]",
  cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const url = args[0]?.trim();

  if (!url || !url.includes("tiktok"))
    return api.sendMessage("❌ أرسل رابط الفيديو من تيك توك\nمثال: تيك https://vm.tiktok.com/xxx", threadID, messageID);

  const waitMsg = await new Promise(r => api.sendMessage("🔄 جاري تحميل الفيديو...", threadID, (e, i) => r(i)));

  try {
    const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, { timeout: 15000 });
    const data = res.data?.data;

    if (!data?.play)
      throw new Error("تعذر جلب الفيديو من tikwm");

    const videoURL = data.play;
    const tmpPath  = path.join(require("os").tmpdir(), `tiktok_${Date.now()}.mp4`);

    const download = await axios.get(videoURL, { responseType: "arraybuffer", timeout: 30000 });
    fs.writeFileSync(tmpPath, Buffer.from(download.data));

    const author = data.author?.nickname || "مجهول";
    const desc   = (data.title || "").slice(0, 80) || "بدون وصف";

    if (waitMsg) api.unsendMessage(waitMsg.messageID);
    api.sendMessage({
      body: `🎬 ${desc}\n👤 ${author}`,
      attachment: fs.createReadStream(tmpPath)
    }, threadID, () => {
      try { fs.unlinkSync(tmpPath); } catch(e) {}
    }, messageID);

  } catch(err) {
    if (waitMsg) api.unsendMessage(waitMsg.messageID);
    return api.sendMessage(`❌ تعذر تحميل الفيديو\n${err.message}`, threadID, messageID);
  }
};