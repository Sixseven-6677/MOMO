const axios = require("axios");

// ── إعدادات ──────────────────────────────────────────────────────────────────
const REPORT_COOLDOWN   = 10 * 60 * 1000;  // 10 دقائق بين بلاغين على نفس الشخص
const MAX_REPORTS_HOUR  = 20;              // حد أقصى للبلاغات في الساعة
const CONFIDENCE_THRESHOLD = 2;           // عدد كلمات مطابقة للبلاغ

// ── تتبع البلاغات ────────────────────────────────────────────────────────────
const reportedUsers   = global._ar_reportedUsers   || (global._ar_reportedUsers   = new Map());
const hourlyReports   = global._ar_hourlyReports   || (global._ar_hourlyReports   = { count: 0, reset: Date.now() + 3600000 });
const fbSession       = global._ar_fbSession       || (global._ar_fbSession       = { dtsg: null, cookies: null, lastRefresh: 0 });

// ── معايير انتهاكات فيسبوك ──────────────────────────────────────────────────
const VIOLATIONS = [
  {
    type: "hate_speech",
    reason: 8,
    patterns: [
      // عنصرية وتمييز
      /كلب|خنزير|حيوان|قرد|زبالة/u,
      /اليهود|الصهاينة|احتل|عنصر/u,
      /أنجاس|أقذار|نجس|قذر|سفلة|حقير/u,
      /موتوا|اذبحوا|اقتلوا|انتهوا|أبادوا/u,
      /كفار يموتوا|نصارى يموتوا|يهود يموتوا/u,
      /تحريض.*ضد|أكره.*[مسلمين|مسيحيين|يهود]/u,
    ]
  },
  {
    type: "violence",
    reason: 2,
    patterns: [
      /سأقتل|سأذبح|هأقتل|راح أقتل|بقتلك|بقتله/u,
      /سأنتقم|هأنتقم|راح أنتقم/u,
      /سأضربك|هأضربك|بضربك|بكسر رأسك/u,
      /أفجر|أنسف|أفخخ|قنبلة|متفجرات/u,
      /سلاح.*تهديد|بندقية.*تهديد|مسدس.*تهديد/u,
      /ذبح.*وعيد|سكين.*تهديد|قتل.*وعيد/u,
    ]
  },
  {
    type: "harassment",
    reason: 3,
    patterns: [
      /ابن.*[قحبة|متناكة|عاهرة]|أمك.*[قحبة|متناكة]/u,
      /يلعن.*أمك|يلعن.*دينك|العن.*أمك/u,
      /كس.*أمك|طيز.*أمك/u,
      /عاهر|شرموط|متناك|زانية|قحبة/u,
      /أخوك.*[شتيمة]|أختك.*[شتيمة]/u,
    ]
  },
  {
    type: "sexual_content",
    reason: 1,
    patterns: [
      /صور.*عارية|فيديو.*جنسي|بورن|بورنو/u,
      /سكس|xxx|نيك|مص.*جنسي|تناك/u,
      /تبادل.*صور.*خاصة|ارسل.*صورك.*عارية/u,
      /قضيب|مهبل|شرج.*جنسي/u,
    ]
  },
  {
    type: "terrorism",
    reason: 9,
    patterns: [
      /داعش|القاعدة|بوكو حرام|طالبان.*تأييد/u,
      /الجهاد.*[قتل|ذبح]|عملية.*إرهابية/u,
      /استشهاد.*[تفجير|انتحار]|تفجير.*نفسك/u,
      /أنضم.*[داعش|إرهاب]|بيعة.*[داعش|تنظيم]/u,
    ]
  },
  {
    type: "drugs",
    reason: 7,
    patterns: [
      /بيع.*[حشيش|مخدرات|كوكايين|هيروين|حبوب]/u,
      /[حشيش|مخدرات|كوكايين|هيروين].*للبيع/u,
      /اشتري.*مخدرات|توصيل.*مخدرات/u,
      /حبوب.*[كبتاجون|ترامادول|مهدئات].*بيع/u,
    ]
  },
  {
    type: "self_harm",
    reason: 4,
    patterns: [
      /سأنتحر|هأنتحر|ناوي أنتحر|أريد الموت/u,
      /أقتل نفسي|أجرح نفسي|أضر نفسي/u,
      /كيفية.*الانتحار|طريقة.*الانتحار/u,
    ]
  },
  {
    type: "spam_scam",
    reason: 6,
    patterns: [
      /ربح.*[مضمون|سريع].*واتساب|ارسل.*رقمك.*ربح/u,
      /[اشحن|شحن].*مجاني.*اضغط|روابط.*احتيال/u,
      /حسابك.*تعطل.*اضغط|تم.*اختراق.*حسابك.*اضغط/u,
      /مبروك.*ربحت.*اضغط|تم.*اختيارك.*اضغط/u,
    ]
  }
];

// ── جلب جلسة فيسبوك المصادقة ────────────────────────────────────────────────
async function refreshSession(api) {
  try {
    const appState = api.getAppState();
    const cookieStr = appState.map(c => c.key + "=" + c.value).join("; ");
    
    const res = await axios.get("https://www.facebook.com/", {
      headers: {
        "Cookie": cookieStr,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "ar,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml"
      },
      timeout: 15000,
      maxRedirects: 3
    });

    // استخراج fb_dtsg
    const m1 = res.data.match(/"DTSGInitData"[^"]*"[^"]*","token":"([^"]+)"/);
    const m2 = res.data.match(/\"DTSGInitData\"[^\]+\"token\":\"([^\]+)\"/);
    const m3 = res.data.match(/name="fb_dtsg" value="([^"]+)"/);
    const m4 = res.data.match(/"token":"(EAA[^"]+)"/);
    
    const dtsg = (m1 && m1[1]) || (m2 && m2[1]) || (m3 && m3[1]) || (m4 && m4[1]);
    
    if (dtsg) {
      fbSession.dtsg    = dtsg;
      fbSession.cookies = cookieStr;
      fbSession.lastRefresh = Date.now();
      return true;
    }
  } catch(e) {}
  return false;
}

// ── إرسال البلاغ لفيسبوك ─────────────────────────────────────────────────────
async function sendReport(messageID, reason, api) {
  // تحديث الجلسة إذا انتهت (كل ساعة)
  if (!fbSession.dtsg || Date.now() - fbSession.lastRefresh > 3600000) {
    await refreshSession(api);
  }
  if (!fbSession.dtsg || !fbSession.cookies) return false;

  try {
    // استخراج mid النقي من messageID إذا كان بصيغة mid.xxx
    const mid = String(messageID);

    // محاولة 1: AJAX report endpoint الكلاسيكي
    await axios.post(
      "https://www.facebook.com/ajax/report/social.php",
      new URLSearchParams({
        content_type:   "14",
        object_id:      mid,
        reason:         String(reason),
        sub_reason:     "0",
        __a:            "1",
        __dyn:          "",
        fb_dtsg:        fbSession.dtsg,
        jazoest:        "2999"
      }).toString(),
      {
        headers: {
          "Cookie":       fbSession.cookies,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer":      "https://www.facebook.com/",
          "Origin":       "https://www.facebook.com",
          "X-FB-LSD":     fbSession.dtsg
        },
        timeout: 10000
      }
    );
    return true;
  } catch(e) {
    fbSession.dtsg = null; // أعد الجلسة عند الفشل
    return false;
  }
}

// ── كشف الانتهاكات ───────────────────────────────────────────────────────────
function detectViolation(text) {
  if (!text || text.length < 5) return null;
  const lower = text.toLowerCase();
  
  let bestMatch = null;
  let bestScore = 0;

  for (const viol of VIOLATIONS) {
    let score = 0;
    for (const pattern of viol.patterns) {
      if (pattern.test(lower)) score++;
    }
    if (score > 0 && score > bestScore) {
      bestScore = score;
      bestMatch = { ...viol, score };
    }
  }

  return bestScore >= 1 ? bestMatch : null;
}

// ── حد البلاغات في الساعة ──────────────────────────────────────────────────
function checkHourlyLimit() {
  if (Date.now() > hourlyReports.reset) {
    hourlyReports.count = 0;
    hourlyReports.reset = Date.now() + 3600000;
  }
  if (hourlyReports.count >= MAX_REPORTS_HOUR) return false;
  hourlyReports.count++;
  return true;
}

// ── الإعداد ──────────────────────────────────────────────────────────────────
module.exports.config = {
  name:        "auto_report",
  eventType:   ["message", "message_reply"],
  version:     "1.0.0",
  credits:     "MOMO",
  description: "مراقبة تلقائية صامتة وإبلاغ فيسبوك عن انتهاكات معايير المجتمع"
};

module.exports.run = async function({ api, event }) {
  if (!event || !event.body || !event.body.trim()) return;

  const { body, senderID, messageID, threadID } = event;

  // تجاهل رسائل البوت نفسه
  try {
    const botID = api.getCurrentUserID();
    if (String(senderID) === String(botID)) return;
  } catch(e) {}

  // تجاهل أدمن البوت
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (adminIDs.includes(String(senderID))) return;

  // كشف الانتهاك
  const violation = detectViolation(body);
  if (!violation) return;

  // cooldown للمستخدم نفسه
  const cooldownKey = senderID + "_" + violation.type;
  const lastReport  = reportedUsers.get(cooldownKey) || 0;
  if (Date.now() - lastReport < REPORT_COOLDOWN) return;

  // حد الساعة
  if (!checkHourlyLimit()) return;

  // إرسال البلاغ بصمت
  const success = await sendReport(messageID, violation.reason, api);
  if (success) {
    reportedUsers.set(cooldownKey, Date.now());
    // تنظيف خريطة البلاغات القديمة (لمنع memory leak)
    if (reportedUsers.size > 500) {
      const oldestKey = reportedUsers.keys().next().value;
      reportedUsers.delete(oldestKey);
    }
  }
};
