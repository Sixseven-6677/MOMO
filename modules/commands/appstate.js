const fs = require("fs");
const path = require("path");

const APPSTATE_PATH = path.join(process.cwd(), "appstate.json");

module.exports.config = {
  name: "appstate",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "تحديث appstate (كوكيز) البوت مباشرة من الشات",
  commandCategory: "أوامر",
  usages: "appstate {الصق JSON هنا} | appstate رد على رسالة تحتوي JSON",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply } = event;

  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  let rawJson = "";

  if (messageReply && messageReply.body) {
    rawJson = messageReply.body.trim();
  } else if (args.length > 0) {
    rawJson = args.join(" ").trim();
  }

  if (!rawJson) {
    return api.sendMessage(
      `📋 طريقة استخدام appstate:\n\n` +
      `1️⃣ الصق JSON الكوكيز مباشرة:\n` +
      `   appstate [{...}]\n\n` +
      `2️⃣ أو أرسل JSON في رسالة منفردة ثم رد عليها بـ:\n` +
      `   appstate\n\n` +
      `⚠️ بعد التحديث سيُعيد البوت التشغيل تلقائياً`,
      threadID, messageID
    );
  }

  let parsed;
  try {
    const jsonStr = rawJson
      .replace(/^```json?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed) && !parsed.cookies)
      throw new Error("الصيغة غير صحيحة — يجب أن يكون JSON مصفوفة كوكيز");

    if (Array.isArray(parsed) && parsed.length === 0)
      throw new Error("المصفوفة فارغة");

  } catch (e) {
    return api.sendMessage(
      `❌ فشل تحليل JSON:\n${e.message}\n\n` +
      `تأكد أن تنسيق الكوكيز صحيح (مصفوفة [{key,value,...}])`,
      threadID, messageID
    );
  }

  try {
    const backup = APPSTATE_PATH + ".bak";
    if (fs.existsSync(APPSTATE_PATH))
      fs.copyFileSync(APPSTATE_PATH, backup);

    fs.writeFileSync(APPSTATE_PATH, JSON.stringify(parsed, null, 2), "utf8");

    await api.sendMessage(
      `✅ تم تحديث appstate.json بنجاح!\n\n` +
      `🍪 عدد الكوكيز: ${Array.isArray(parsed) ? parsed.length : "N/A"}\n` +
      `💾 تم حفظ نسخة احتياطية\n\n` +
      `🔄 البوت سيُعيد التشغيل الآن لتطبيق التغييرات...`,
      threadID, messageID
    );

    setTimeout(() => process.exit(0), 2000);

  } catch (e) {
    return api.sendMessage(
      `❌ فشل حفظ الملف:\n${e.message}`,
      threadID, messageID
    );
  }
};
