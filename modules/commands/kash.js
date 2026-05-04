const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "كاش",
  version: "1.0.0",
  hasPermssion: 3,
  credits: "MOMO",
  description: "تنظيف ملفات الكاش لتخفيف البوت",
  commandCategory: "أوامر",
  usages: "كاش",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = global.config.ADMINBOT || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  const KEEP = new Set(["data.json", "admins.json", "disabled_threads.json", "xavier_msg.txt"]);
  const dirs = [
    path.join(__dirname, "cache"),
    path.join(__dirname, "anh"),
    path.join(process.cwd(), "tmp"),
  ];

  let deleted = 0, freed = 0;

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      for (const file of fs.readdirSync(dir)) {
        if (KEEP.has(file)) continue;
        const fp = path.join(dir, file);
        try {
          const stat = fs.statSync(fp);
          if (stat.isFile()) {
            freed += stat.size;
            fs.unlinkSync(fp);
            deleted++;
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  // تنظيف ذاكرة Node.js
  if (global.gc) global.gc();

  const freedKB = (freed / 1024).toFixed(1);
  const freedMB = (freed / 1024 / 1024).toFixed(2);

  return api.sendMessage(
    `🧹 تم تنظيف الكاش!\n\n` +
    `📁 ملفات محذوفة: ${deleted}\n` +
    `💾 مساحة محررة: ${freed > 1024 * 100 ? freedMB + " MB" : freedKB + " KB"}\n\n` +
    `✅ البوت جاهز ويعمل بخفة أكثر`,
    threadID, messageID
  );
};
