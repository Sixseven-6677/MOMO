const fs = require("fs");
const path = require("path");
const msgPath = path.join(__dirname, "cache/xavier_msg.txt");

module.exports.config = {
  name: "تحديث",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "تحديث رسالة خافير التي ترسل كل 30 ثانية",
  commandCategory: "أوامر",
  usages: "تحديث رسالة [النص]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const adminIDs = global.config.ADMINBOT || [];
  if (!adminIDs.includes(String(senderID))) {
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);
  }

  if (args[0] !== "رسالة") {
    return api.sendMessage(
      `:𝖀𝖲𝖺𝗀𝖾 ꗇ-\n\nꖛ تحديث رسالة 〔النص الجديد〕\n\n𝖤𝖃- مثال\n\nꗇ تحديث رسالة اهلا`,
      threadID, messageID
    );
  }

  const newMsg = args.slice(1).join(" ");
  if (!newMsg.trim()) {
    return api.sendMessage("❌ اكتب الرسالة الجديدة بعد كلمة رسالة", threadID, messageID);
  }

  try {
    fs.writeFileSync(msgPath, newMsg, "utf8");
    return api.sendMessage(
      `✅ تم تحديث رسالة التوسيع\n\n📝 الرسالة الجديدة:\n${newMsg}\n\nالآن عند قول تفعيل توسيع سيرسل هذه الرسالة كل 30 ثانية`,
      threadID, messageID
    );
  } catch (e) {
    return api.sendMessage("❌ فشل حفظ الرسالة", threadID, messageID);
  }
};
