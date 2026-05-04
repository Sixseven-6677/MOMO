const fs = require("fs");
const path = require("path");
const login = require("../../lib/fca-auto");

const ACCOUNTS_DIR = path.join(process.cwd(), "modules/commands/data/accounts");

module.exports.config = {
  name: "appstate",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "تسجيل دخول حساب جديد - يشتغل مع الحساب الحالي في نفس الوقت",
  commandCategory: "أوامر",
  usages: "appstate {الصق JSON هنا} | appstate (ردّ على رسالة تحتوي JSON)",
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

  // عرض حالة الحسابات إذا لم يُرسل JSON
  if (!rawJson) {
    const extras = global.client.extraAccounts || [];
    const mainID = api.getCurrentUserID();
    let msg = `📋 أمر appstate\n\n`;
    msg += `📊 الحسابات النشطة: ${1 + extras.length}\n`;
    msg += `1. الحساب الرئيسي — ID: ${mainID}\n`;
    extras.forEach((a, i) => {
      msg += `${i + 2}. حساب ${i + 2} — ID: ${a.id}\n`;
    });
    msg += `\n━━━━━━━━━━━━━━━\n`;
    msg += `لإضافة حساب جديد:\n`;
    msg += `• الصق JSON الكوكيز مباشرة:\n  appstate [{...}]\n\n`;
    msg += `• أو أرسل JSON في رسالة ثم ردّ عليها بـ:\n  appstate`;
    return api.sendMessage(msg, threadID, messageID);
  }

  // تحليل JSON
  let parsed;
  try {
    const jsonStr = rawJson
      .replace(/^```json?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed) && !parsed.cookies)
      throw new Error("يجب أن يكون JSON مصفوفة كوكيز صحيحة");
    if (Array.isArray(parsed) && parsed.length === 0)
      throw new Error("المصفوفة فارغة");
  } catch (e) {
    return api.sendMessage(
      `❌ فشل تحليل JSON:\n${e.message}\n\nتأكد أن الكوكيز صحيحة (مصفوفة [{key,value,...}])`,
      threadID, messageID
    );
  }

  await api.sendMessage(`⏳ جاري تسجيل الدخول للحساب الجديد...`, threadID, messageID);

  try {
    login({ appState: parsed }, async (loginError, api2) => {
      if (loginError) {
        return api.sendMessage(
          `❌ فشل تسجيل الدخول:\n${JSON.stringify(loginError).substring(0, 200)}\n\nتحقق أن الكوكيز صحيحة وغير منتهية الصلاحية`,
          threadID, messageID
        );
      }

      try {
        api2.setOptions(global.config.FCAOption || {});
      } catch (e) {}

      const newID = api2.getCurrentUserID();

      // منع تسجيل نفس الحساب مرتين
      const existing = global.client.extraAccounts || [];
      const mainID = api.getCurrentUserID();
      if (String(newID) === String(mainID) || existing.some(a => String(a.id) === String(newID))) {
        return api.sendMessage(
          `⚠️ هذا الحساب (ID: ${newID}) مسجّل دخول بالفعل`,
          threadID, messageID
        );
      }

      // حفظ الكوكيز المحدثة
      if (!fs.existsSync(ACCOUNTS_DIR)) fs.mkdirSync(ACCOUNTS_DIR, { recursive: true });
      const accountIndex = existing.length + 2;
      const appstatePath = path.join(ACCOUNTS_DIR, `appstate_${accountIndex}.json`);
      try {
        fs.writeFileSync(appstatePath, JSON.stringify(api2.getAppState(), null, 2), "utf8");
      } catch (e) {}

      // إعداد قاعدة البيانات للحساب الجديد
      let models;
      try {
        const { Sequelize, sequelize } = require("../../includes/database");
        models = require("../../includes/database/model")({ Sequelize, sequelize });
      } catch (e) {
        // استخدام نفس models الحساب الأصلي إن وُجدت
        models = global.client.models || null;
      }

      // إعداد listener للحساب الجديد
      let handleListen2 = null;
      try {
        const listener = require("../../includes/listen_account")({ api: api2, models });
        handleListen2 = api2.listenMqtt((error, message) => {
          if (error) return;
          if (['presence', 'typ', 'read_receipt'].some(d => d == message.type)) return;
          if (global.config && global.config.DeveloperMode) console.log(`[Account ${accountIndex}]`, message);
          listener(message);
        });
      } catch (e) {
        console.error(`[Multi-Account] Listener error for account ${accountIndex}:`, e.message);
      }

      // حفظ الحساب في القائمة العالمية
      if (!global.client.extraAccounts) global.client.extraAccounts = [];
      global.client.extraAccounts.push({
        id: newID,
        api: api2,
        handle: handleListen2,
        appstatePath
      });

      return api.sendMessage(
        `✅ تم تسجيل دخول حساب جديد بنجاح!\n\n` +
        `🆔 ID: ${newID}\n` +
        `📊 إجمالي الحسابات النشطة: ${1 + global.client.extraAccounts.length}\n\n` +
        `البوتان يعملان الآن معاً في نفس الوقت ✨`,
        threadID, messageID
      );
    });
  } catch (e) {
    return api.sendMessage(`❌ خطأ غير متوقع:\n${e.message}`, threadID, messageID);
  }
};
