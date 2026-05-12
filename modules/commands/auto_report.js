const axios = require("axios");

// ── إعدادات ──────────────────────────────────────────────────────────────────
const REPORT_COOLDOWN  = 15 * 60 * 1000;  // 15 دقيقة cooldown لكل شخص/نوع
const MAX_REPORTS_HOUR = 25;               // حد أقصى للبلاغات في الساعة
const fbSession = global._ar_session || (global._ar_session = { dtsg: null, cookies: null, ts: 0 });
const reportedMap = global._ar_map || (global._ar_map = new Map());
const hourly = global._ar_hourly || (global._ar_hourly = { n: 0, reset: Date.now() + 3600000 });

// ── معايير انتهاكات فيسبوك (عربي + إنجليزي) ─────────────────────────────────
const VIOLATIONS = [
  {
    type: "hate_speech", reason: 8,
    re: [
      /موتوا|اذبحوا|اقتلوا|أبادوا|انهوهم/u,
      /[كالقردة|كالكلاب|كالخنازير].*(عرب|مسلم|يهود|نصارى)/u,
      /أنجاس|أقذار|سفلة|حقير.*[عرق|دين|جنس]/u,
      /كفار.*يموتوا|يهود.*يموتوا|نصارى.*يموتوا/u,
      /hate.*[race|religion|ethnic]|kill all.*[jews|muslims|christians]/i,
      /تحريض.*ضد.*(مسلمين|مسيحيين|يهود|عرب)/u,
    ]
  },
  {
    type: "violence", reason: 2,
    re: [
      /سأقتل|هأقتل|راح أقتل|بقتلك|بذبحك/u,
      /سأنتقم.*منك|هأنتقم.*منك|راح أنتقم/u,
      /أفجر|أنسف|أفخخ|قنبلة.*هدد|متفجرات.*هدد/u,
      /i will kill|gonna kill|i'll stab|death threat/i,
      /سأضربك.*بشدة|بكسر رأسك|بحرق بيتك/u,
      /ذبح.*وعيد|سكين.*تهديد|قتل.*تهديد/u,
    ]
  },
  {
    type: "harassment", reason: 3,
    re: [
      /ابن (قحبة|عاهرة|متناكة|زانية)/u,
      /أمك (قحبة|عاهرة|شرموط|متناكة)/u,
      /يلعن أمك|يلعن دينك|العن أمك/u,
      /كس أمك|طيز أمك/u,
      /عاهر|شرموطة|متناك(?!ة)|زانية|قحبة/u,
      /أختك.*شرموط|أخوك.*متناك/u,
    ]
  },
  {
    type: "sexual_content", reason: 1,
    re: [
      /صور.*عارية.*أرسل|فيديو.*جنسي.*أرسل/u,
      /بورن|بورنو|pornhub|xvideos|xnxx/i,
      /سكس|xxx|nيك|تناك|مص.*جنسي/u,
      /تبادل.*صور.*خاصة|ارسل.*صورك.*عارية/u,
    ]
  },
  {
    type: "terrorism", reason: 9,
    re: [
      /داعش.*أنضم|القاعدة.*أنضم|بيعة.*داعش/u,
      /عملية.*إرهابية|هجوم.*إرهابي.*تنفيذ/u,
      /تفجير نفسك|استشهاد.*تفجير/u,
      /join.*isis|isis.*attack|terrorist.*bomb/i,
    ]
  },
  {
    type: "drugs", reason: 7,
    re: [
      /بيع.*(حشيش|مخدرات|كوكايين|هيروين|شابو)/u,
      /(حشيش|مخدرات|كوكايين|هيروين).*للبيع/u,
      /توصيل.*مخدرات|اشتري.*مخدرات/u,
      /كبتاجون.*بيع|ترامادول.*بيع/u,
      /selling.*(drugs|cocaine|heroin|meth)/i,
    ]
  },
  {
    type: "self_harm", reason: 4,
    re: [
      /سأنتحر|هأنتحر|ناوي أنتحر/u,
      /أقتل نفسي|أجرح نفسي.*عمداً/u,
      /كيفية الانتحار|طريقة الانتحار/u,
      /how to.*suicide|kill myself.*method/i,
    ]
  },
  {
    type: "scam", reason: 6,
    re: [
      /ربح.*مضمون.*واتساب|ربح.*سريع.*اضغط/u,
      /حسابك.*تعطل.*اضغط.*الآن|تم.*اختراق.*حسابك.*اضغط/u,
      /مبروك.*ربحت.*اضغط|تم.*اختيارك.*اضغط/u,
      /phishing|account.*hacked.*click.*now/i,
    ]
  }
];

// ── جلب جلسة فيسبوك ──────────────────────────────────────────────────────────
async function refreshSession(api) {
  try {
    const appState = api.getAppState();
    if (!appState || !appState.length) return false;
    const cookieStr = appState.map(c => c.key + "=" + c.value).join("; ");

    const res = await axios.get("https://www.facebook.com/", {
      headers: {
        "Cookie": cookieStr,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ar,en;q=0.9"
      },
      timeout: 12000,
      maxRedirects: 3
    });

    const html = res.data || "";
    const m = html.match(/"DTSGInitData"[\s\S]{0,100}"token":"([^"]{10,})"/) ||
              html.match(/name="fb_dtsg"[^>]*value="([^"]+)"/) ||
              html.match(/"token":"(EAA[A-Za-z0-9]+)"/);

    if (m && m[1]) {
      fbSession.dtsg    = m[1];
      fbSession.cookies = cookieStr;
      fbSession.ts      = Date.now();
      return true;
    }
  } catch(e) {}
  return false;
}

// ── إرسال البلاغ ─────────────────────────────────────────────────────────────
async function sendReport(messageID, reason, api) {
  if (!fbSession.dtsg || Date.now() - fbSession.ts > 3600000) {
    const ok = await refreshSession(api);
    if (!ok) return false;
  }
  try {
    await axios.post(
      "https://www.facebook.com/ajax/report/social.php",
      new URLSearchParams({
        content_type: "14",
        object_id:    String(messageID),
        reason:       String(reason),
        sub_reason:   "0",
        fb_dtsg:      fbSession.dtsg,
        __a:          "1",
        jazoest:      "2" + fbSession.dtsg.charCodeAt(0)
      }).toString(),
      {
        headers: {
          "Cookie":         fbSession.cookies,
          "Content-Type":   "application/x-www-form-urlencoded",
          "User-Agent":     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Origin":         "https://www.facebook.com",
          "Referer":        "https://www.facebook.com/",
          "X-FB-LSD":       fbSession.dtsg
        },
        timeout: 10000
      }
    );
    return true;
  } catch(e) {
    if (e.response?.status === 400 || e.response?.status === 401) fbSession.dtsg = null;
    return false;
  }
}

// ── كشف الانتهاك ─────────────────────────────────────────────────────────────
function detectViolation(text) {
  if (!text || text.length < 6) return null;
  const lower = text.toLowerCase();
  for (const v of VIOLATIONS) {
    for (const re of v.re) {
      if (re.test(lower)) return v;
    }
  }
  return null;
}

function checkHourly() {
  if (Date.now() > hourly.reset) { hourly.n = 0; hourly.reset = Date.now() + 3600000; }
  if (hourly.n >= MAX_REPORTS_HOUR) return false;
  hourly.n++;
  return true;
}

// ── Config (أمر مخفي لعرض الإحصائيات للأدمن فقط) ───────────────────────────
module.exports.config = {
  name:            "raqeeb",
  version:         "1.0.0",
  hasPermssion:    3,
  credits:         "MOMO",
  description:     "[System] مراقب تلقائي صامت لانتهاكات معايير فيسبوك",
  commandCategory: "System",
  usages:          "raqeeb",
  cooldowns:       0
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID))) return;

  const total  = hourly.n;
  const mapSz  = reportedMap.size;
  const status = fbSession.dtsg ? "✅ نشطة" : "⏳ تحتاج تهيئة";
  const reset  = Math.max(0, Math.floor((hourly.reset - Date.now()) / 60000));

  return api.sendMessage(
    "🛡 نظام الإبلاغ التلقائي\n" +
    "━━━━━━━━━━━━━━━\n" +
    "جلسة فيسبوك: " + status + "\n" +
    "بلاغات هذه الساعة: " + total + "/" + MAX_REPORTS_HOUR + "\n" +
    "مستخدمون مُراقَبون: " + mapSz + "\n" +
    "تجديد الحد بعد: " + reset + " دقيقة\n" +
    "━━━━━━━━━━━━━━━\n" +
    "يعمل تلقائياً بصمت على كل الغروبات",
    threadID, messageID
  );
};

// ── المراقب التلقائي — يعمل على كل رسالة ────────────────────────────────────
module.exports.handleEvent = async function({ api, event }) {
  if (!event || !event.body || !event.body.trim()) return;
  if (event.type !== "message" && event.type !== "message_reply") return;

  const { body, senderID, messageID } = event;

  // تجاهل البوت والأدمن
  try {
    const botID = String(api.getCurrentUserID());
    if (senderID === botID) return;
  } catch(e) {}
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (adminIDs.includes(String(senderID))) return;

  // كشف الانتهاك
  const v = detectViolation(body);
  if (!v) return;

  // cooldown
  const key = senderID + ":" + v.type;
  const last = reportedMap.get(key) || 0;
  if (Date.now() - last < REPORT_COOLDOWN) return;

  // حد الساعة
  if (!checkHourly()) return;

  // إبلاغ صامت
  const ok = await sendReport(messageID, v.reason, api);
  if (ok) {
    reportedMap.set(key, Date.now());
    if (reportedMap.size > 1000) {
      const oldest = reportedMap.keys().next().value;
      reportedMap.delete(oldest);
    }
  }
};
