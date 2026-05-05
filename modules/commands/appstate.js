const fs   = require("fs");
const path = require("path");

// مسار الـ appstate الرئيسي الذي يقرأه البوت عند بدء التشغيل
const APPSTATE_PATH = path.join(process.cwd(), "appstate.json");
// نسخة احتياطية من الحساب الحالي
const BACKUP_PATH   = path.join(process.cwd(), "appstate.backup.json");

module.exports.config = {
  name: "كوكيز",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "تغيير حساب البوت عبر الكوكيز — يُعيد التشغيل فوراً",
  commandCategory: "أوامر",
  usages: "كوكيز {JSON} | كوكيز (ردّ على رسالة تحتوي JSON)",
  cooldowns: 0
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply } = event;

  // التحقق من الصلاحية
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  // عرض حالة الحساب الحالي إذا لم يُرسل JSON
  let rawJson = "";
  if (messageReply && messageReply.body) rawJson = messageReply.body.trim();
  else if (args.length > 0) rawJson = args.join(" ").trim();

  if (!rawJson) {
    let currentID = "؟";
    try { currentID = api.getCurrentUserID(); } catch (e) {}
    const hasBackup = fs.existsSync(BACKUP_PATH);
    return api.sendMessage(
      `📋 أمر الكوكيز\n\n` +
      `👤 الحساب الحالي: ID ${currentID}\n` +
      `💾 نسخة احتياطية: ${hasBackup ? "✅ موجودة" : "❌ لا توجد"}\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `لتغيير الحساب:\nالصق الكوكيز JSON بعد الأمر:\n  كوكيز [{...}]\n\n` +
      `أو أرسل JSON في رسالة وردّ عليها بـ:\n  كوكيز\n\n` +
      `⚠️ البوت سيعيد تشغيله تلقائياً بعد التغيير`,
      threadID, messageID
    );
  }

  // ── تحليل JSON ──
  let parsed;
  try {
    const cleaned = rawJson
      .replace(/^```json?\s*/i, "")
      .replace(/```\s*$/,        "")
      .trim();
    parsed = JSON.parse(cleaned);

    // قبول المصفوفة المباشرة أو { cookies: [...] }
    if (!Array.isArray(parsed)) {
      if (Array.isArray(parsed.cookies)) parsed = parsed.cookies;
      else if (Array.isArray(parsed.AppState)) parsed = parsed.AppState;
      else throw new Error("القيمة يجب أن تكون مصفوفة كوكيز (Array)");
    }
    if (parsed.length === 0) throw new Error("المصفوفة فارغة — أرسل كوكيز حقيقية");
  } catch (e) {
    return api.sendMessage(
      `❌ خطأ في تحليل JSON:\n${e.message}\n\n` +
      `تأكد أن الكوكيز مصفوفة بالشكل:\n[{"key":"...","value":"..."}]`,
      threadID, messageID
    );
  }

  // ── التحقق من وجود حقول Facebook الأساسية ──
  const keys = parsed.map(c => (c.key || c.name || "").toLowerCase());
  const hasCore = keys.some(k => k === "c_user") && keys.some(k => k === "xs");
  if (!hasCore) {
    return api.sendMessage(
      `❌ الكوكيز لا تبدو صحيحة!\n\n` +
      `لم يُعثر على حقلي "c_user" و"xs" الأساسيين.\n` +
      `تأكد أنها كوكيز فيسبوك حقيقية وغير منتهية الصلاحية.`,
      threadID, messageID
    );
  }

  // ── نسخة احتياطية من الكوكيز الحالية ──
  try {
    if (fs.existsSync(APPSTATE_PATH)) {
      fs.copyFileSync(APPSTATE_PATH, BACKUP_PATH);
    }
  } catch (e) { /* لا يوقف العملية */ }

  // ── الحفظ في appstate.json ──
  try {
    fs.writeFileSync(APPSTATE_PATH, JSON.stringify(parsed, null, 2), "utf8");
  } catch (e) {
    return api.sendMessage(
      `❌ فشل حفظ الكوكيز في الملف:\n${e.message}`,
      threadID, messageID
    );
  }

  // تأكيد الحفظ
  const cUser = parsed.find(c => (c.key || c.name || "").toLowerCase() === "c_user");
  const accountHint = cUser ? `\n👤 المعرّف الجديد: ${cUser.value || cUser.val || "؟"}` : "";

  await api.sendMessage(
    `✅ تم حفظ الكوكيز بنجاح!${accountHint}\n\n` +
    `⏳ البوت يُعيد تشغيله الآن...\n` +
    `انتظر 10-20 ثانية ثم أرسل أي رسالة للتأكد من تسجيل الدخول`,
    threadID, messageID
  );

  // ── إعادة التشغيل (index.js يعيد تشغيل البوت عند exit code 1) ──
  setTimeout(() => process.exit(1), 1500);
};
