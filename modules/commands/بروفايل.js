const axios = require("axios");
const fsmod = require("fs");
const path = require("path");

module.exports.config = {
  name: "بروفايل",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "عرض معلومات حساب فيسبوك — عبر الـ ID أو الرابط أو الرد على رسالة",
  commandCategory: "أوامر",
  usages: "بروفايل [ID] | بروفايل [رابط] | رد على رسالة + بروفايل",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply } = event;

  let uid = null;
  let resolveMethod = "direct";

  // 1) رد على رسالة
  if (!args[0] && messageReply && messageReply.senderID) {
    uid = String(messageReply.senderID);
    resolveMethod = "reply";
  }
  // 2) بدون args — معلومات المستخدم نفسه
  else if (!args[0]) {
    uid = String(senderID);
    resolveMethod = "self";
  }
  else {
    const input = args[0].trim();
    // 3) رابط فيسبوك
    if (input.includes("facebook.com") || input.includes("fb.com") || input.includes("fb.watch")) {
      resolveMethod = "url";
      await api.sendMessage("🔍 جاري جلب المعلومات...", threadID, messageID);
      try {
        uid = await new Promise((resolve, reject) => {
          api.getUID(input, (err, id) => {
            if (err || !id || id == 4) return reject(new Error("تعذّر جلب الـ ID من الرابط"));
            resolve(String(id));
          });
        });
      } catch(e) {
        return api.sendMessage("❌ " + e.message, threadID, messageID);
      }
    }
    // 4) ID رقمي مباشر
    else if (/^\d{6,}$/.test(input)) {
      uid = input;
      resolveMethod = "id";
    }
    else {
      return api.sendMessage(
        "❌ الاستخدام:\n" +
        "• بروفايل — معلوماتك أنت\n" +
        "• بروفايل [ID] — بالرقم مباشرة\n" +
        "• بروفايل [رابط] — من رابط الحساب\n" +
        "• رد على رسالة شخص + بروفايل",
        threadID, messageID
      );
    }
  }

  // جلب معلومات المستخدم
  let userInfo;
  try {
    userInfo = await new Promise((resolve, reject) => {
      api.getUserInfo(uid, (err, data) => {
        if (err || !data) return reject(new Error("تعذّر جلب معلومات المستخدم"));
        resolve(data);
      });
    });
  } catch(e) {
    return api.sendMessage("❌ " + e.message, threadID, messageID);
  }

  const info = userInfo[uid];
  if (!info) return api.sendMessage("❌ لم يتم العثور على بيانات لهذا الحساب", threadID, messageID);

  // معلومات الغروب
  let threadInfo = null;
  try { threadInfo = await api.getThreadInfo(threadID); } catch(e) {}

  const isAdmin    = threadInfo ? (threadInfo.adminIDs || []).some(a => String(a.id || a) === uid) : false;
  const isMember   = threadInfo ? (threadInfo.participantIDs || []).includes(uid) : false;
  const isBotAdmin = ((global.config && global.config.ADMINBOT) || []).includes(uid);

  const genderMap = { 1: "أنثى 👩", 2: "ذكر 👨" };
  const gender   = genderMap[info.gender] || "غير محدد";
  const isFriend = info.isFriend ? "نعم ✅" : "لا ❌";
  const link     = info.profileUrl || ("https://facebook.com/" + uid);
  const username = info.vanity ? ("@" + info.vanity) : "—";

  const statusLine = [];
  if (isBotAdmin) statusLine.push("👑 أدمن البوت");
  if (isAdmin)    statusLine.push("⭐ أدمن الغروب");
  if (isMember)   statusLine.push("✅ عضو في الغروب");
  else            statusLine.push("❌ ليس عضواً في الغروب");

  const msg =
    "👤 𝗣𝗿𝗼𝗳𝗶𝗹𝗲 𝗜𝗻𝗳𝗼\n" +
    "━━━━━━━━━━━━━━━\n" +
    "📛 الاسم      : " + (info.name || "—") + "\n" +
    "🔤 الاسم الأول: " + (info.firstName || "—") + "\n" +
    "🪪 المعرف    : " + username + "\n" +
    "🆔 الـ ID     : " + uid + "\n" +
    "⚧ الجنس     : " + gender + "\n" +
    "👥 صديق     : " + isFriend + "\n" +
    "🎂 عيد ميلاد : " + (info.isBirthday ? "اليوم 🎉" : "لا") + "\n" +
    "━━━━━━━━━━━━━━━\n" +
    statusLine.join(" | ") + "\n" +
    "━━━━━━━━━━━━━━━\n" +
    "🔗 " + link;

  // إرسال مع صورة البروفايل إن وجدت
  if (info.thumbSrc) {
    const tmpPath = path.join(__dirname, "cache", "profile_" + uid + ".jpg");
    try {
      const res = await axios.get(info.thumbSrc, { responseType: "arraybuffer", timeout: 10000 });
      fsmod.writeFileSync(tmpPath, Buffer.from(res.data));
      await api.sendMessage(
        { body: msg, attachment: fsmod.createReadStream(tmpPath) },
        threadID, messageID
      );
      try { fsmod.unlinkSync(tmpPath); } catch(e) {}
    } catch {
      await api.sendMessage(msg, threadID, messageID);
    }
  } else {
    await api.sendMessage(msg, threadID, messageID);
  }
};
