const fs = require("fs");
const path = require("path");

const ACCOUNTS_DIR = path.join(process.cwd(), "modules/commands/data/accounts");

module.exports.config = {
  name: "appstate",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "تسجيل دخول حساب جديد عبر الكوكيز",
  commandCategory: "أوامر",
  usages: "appstate {الصق JSON هنا}",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply } = event;

  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  // عرض الحسابات الحالية إذا لم يُرسل JSON
  let rawJson = "";
  if (messageReply && messageReply.body) rawJson = messageReply.body.trim();
  else if (args.length > 0) rawJson = args.join(" ").trim();

  if (!rawJson) {
    const extras = global.client.extraAccounts || [];
    let mainID = "؟";
    try { mainID = api.getCurrentUserID(); } catch(e) {}
    let msg = `📋 أمر appstate\n\n`;
    msg += `📊 الحسابات النشطة: ${1 + extras.length}\n`;
    msg += `1. الحساب الرئيسي — ID: ${mainID}\n`;
    extras.forEach((a, i) => { msg += `${i + 2}. حساب ${i + 2} — ID: ${a.id}\n`; });
    msg += `\n━━━━━━━━━━━━━━━\n`;
    msg += `لإضافة حساب:\nالصق الكوكيز JSON بعد الأمر:\nappstate [{...}]\n\nأو رد على رسالة تحتوي JSON بـ:\nappstate`;
    return api.sendMessage(msg, threadID, messageID);
  }

  // تحليل JSON
  let parsed;
  try {
    const jsonStr = rawJson.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
    parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      if (parsed.cookies && Array.isArray(parsed.cookies)) parsed = parsed.cookies;
      else throw new Error("يجب أن يكون JSON مصفوفة كوكيز");
    }
    if (parsed.length === 0) throw new Error("المصفوفة فارغة");
  } catch (e) {
    return api.sendMessage(
      `❌ فشل تحليل JSON:\n${e.message}\n\nتأكد أن الكوكيز صحيحة (مصفوفة من [{key,value,...}])`,
      threadID, messageID
    );
  }

  await api.sendMessage("⏳ جاري التحقق من الكوكيز وتسجيل الدخول...", threadID, messageID);

  // حفظ الكوكيز في ملف أولاً (ضمان الحفظ)
  if (!fs.existsSync(ACCOUNTS_DIR)) fs.mkdirSync(ACCOUNTS_DIR, { recursive: true });
  const extras = global.client.extraAccounts || [];
  const accountIndex = extras.length + 2;
  const appstatePath = path.join(ACCOUNTS_DIR, `appstate_${accountIndex}.json`);
  try {
    fs.writeFileSync(appstatePath, JSON.stringify(parsed, null, 2), "utf8");
  } catch (e) {}

  // محاولة تسجيل الدخول الفوري مع timeout
  try {
    const login = require("../../lib/fca-auto");

    const api2 = await new Promise((resolve, reject) => {
      // timeout 35 ثانية
      const timer = setTimeout(() => {
        reject(new Error("انتهى وقت الانتظار (35 ثانية) — الكوكيز محفوظة، ستعمل عند إعادة التشغيل"));
      }, 35000);

      try {
        login({ appState: parsed }, (loginError, newApi) => {
          clearTimeout(timer);
          if (loginError) {
            reject(new Error(
              typeof loginError === "object"
                ? (loginError.error || loginError.message || JSON.stringify(loginError).substring(0, 150))
                : String(loginError).substring(0, 150)
            ));
          } else {
            resolve(newApi);
          }
        });
      } catch (e) {
        clearTimeout(timer);
        reject(e);
      }
    });

    // تسجيل ناجح
    try { api2.setOptions(global.config.FCAOption || {}); } catch (e) {}

    const newID = api2.getCurrentUserID();

    // منع تسجيل نفس الحساب مرتين
    const currentExtras = global.client.extraAccounts || [];
    let mainID = "";
    try { mainID = api.getCurrentUserID(); } catch(e) {}
    if (String(newID) === String(mainID) || currentExtras.some(a => String(a.id) === String(newID))) {
      return api.sendMessage(`⚠️ الحساب (ID: ${newID}) مسجّل بالفعل`, threadID, messageID);
    }

    // حفظ الكوكيز المحدثة بعد الدخول
    try {
      fs.writeFileSync(appstatePath, JSON.stringify(api2.getAppState(), null, 2), "utf8");
    } catch (e) {}

    // إعداد listener للحساب الجديد
    let handleListen2 = null;
    try {
      const listener = require("../../includes/listen_account")({ api: api2, models: global.client.models || null });
      handleListen2 = api2.listenMqtt((error, message) => {
        if (error) return;
        if (["presence", "typ", "read_receipt"].includes(message.type)) return;
        listener(message);
      });
    } catch (e) {
      console.error("[Multi-Account] Listener error:", e.message);
    }

    // إضافة الحساب للقائمة العالمية
    if (!global.client.extraAccounts) global.client.extraAccounts = [];
    global.client.extraAccounts.push({ id: newID, api: api2, handle: handleListen2, appstatePath });

    return api.sendMessage(
      `✅ تم تسجيل الدخول بنجاح!\n\n🆔 ID: ${newID}\n📊 إجمالي الحسابات النشطة: ${1 + global.client.extraAccounts.length}\n\n✨ الحسابان يعملان معاً الآن`,
      threadID, messageID
    );

  } catch (e) {
    // فشل الدخول الفوري لكن الكوكيز محفوظة
    const isTimeout = e.message && e.message.includes("انتهى وقت");
    const reason = isTimeout
      ? "انتهت مهلة الاتصال (35 ثانية)"
      : (e.message || "خطأ غير معروف");

    return api.sendMessage(
      `⚠️ ${isTimeout ? "تأخر التسجيل" : "فشل تسجيل الدخول"}\n\n` +
      `📝 السبب: ${reason}\n\n` +
      `💾 الكوكيز تم حفظها في:\n${appstatePath}\n\n` +
      `🔄 استخدم أمر ريستارت لتفعيلها عند إعادة التشغيل`,
      threadID, messageID
    );
  }
};
