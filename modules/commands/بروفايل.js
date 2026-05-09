const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "بروفايل",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "عرض معلومات حساب فيسبوك من الرابط",
  commandCategory: "أوامر",
  usages: "بروفايل [رابط الحساب]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args[0]) {
    return api.sendMessage(
      "❌ أرسل رابط الحساب\nمثال: بروفايل https://facebook.com/example",
      threadID, messageID
    );
  }

  const link = args[0].trim();

  try {
    await api.sendMessage("🔍 جاري جلب المعلومات...", threadID, messageID);

    const uid = await new Promise((resolve, reject) => {
      api.getUID(link, (err, id) => {
        if (err || !id || id == 4) return reject(new Error("تعذّر جلب الـ ID من الرابط"));
        resolve(String(id));
      });
    });

    const userInfoMap = await new Promise((resolve, reject) => {
      api.getUserInfo(uid, (err, data) => {
        if (err || !data) return reject(new Error("تعذّر جلب معلومات المستخدم"));
        resolve(data);
      });
    });

    const info = userInfoMap[uid];
    if (!info) return api.sendMessage("❌ لم يتم العثور على بيانات لهذا الحساب", threadID, messageID);

    const genderMap = { 1: "أنثى 👩", 2: "ذكر 👨", 0: "غير محدد" };
    const gender = genderMap[info.gender] || "غير محدد";
    const isFriend = info.isFriend ? "نعم ✅" : "لا ❌";
    const profileLink = info.profileUrl || `https://facebook.com/${uid}`;
    const username = info.vanity ? `@${info.vanity}` : "—";

    const msg =
`👤 𝗣𝗿𝗼𝗳𝗶𝗹𝗲 𝗜𝗻𝗳𝗼
━━━━━━━━━━━━━━━
📛 الاسم     : ${info.name || "—"}
🔤 الاسم الأول: ${info.firstName || "—"}
🪪 المعرف   : ${username}
🆔 الـ ID    : ${uid}
⚧ الجنس    : ${gender}
👥 صديق    : ${isFriend}
🎂 عيد ميلاد: ${info.isBirthday ? "اليوم 🎉" : "لا"}
━━━━━━━━━━━━━━━
🔗 ${profileLink}`;

    if (info.thumbSrc) {
      const tmpPath = path.join(__dirname, "cache", `profile_${uid}.jpg`);
      try {
        const res = await axios.get(info.thumbSrc, { responseType: "arraybuffer", timeout: 10000 });
        await fs.outputFile(tmpPath, Buffer.from(res.data));
        await api.sendMessage(
          { body: msg, attachment: fs.createReadStream(tmpPath) },
          threadID, messageID
        );
        fs.unlink(tmpPath).catch(() => {});
      } catch {
        await api.sendMessage(msg, threadID, messageID);
      }
    } else {
      await api.sendMessage(msg, threadID, messageID);
    }

  } catch (e) {
    return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
  }
};