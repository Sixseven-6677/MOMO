const fs   = require('fs');
const path = require('path');

const DATA_FILE    = path.join(process.cwd(), 'modules/commands/data/tawsi3.json');
const MIN_INTERVAL = 1;    // دقيقة على الأقل
const MAX_INTERVAL = 720;  // 12 ساعة كحد أقصى

// ════════════════════════════════════════════════════════════════
//  قراءة وحفظ البيانات
// ════════════════════════════════════════════════════════════════

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) || {};
  } catch(e) {
    console.error('[توسيع] ❌ خطأ في قراءة البيانات:', e.message);
    return {};
  }
}

function saveData(data) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch(e) {
    console.error('[توسيع] ❌ خطأ في حفظ البيانات:', e.message);
  }
}

function getEntry(threadID) {
  return loadData()[String(threadID)] || null;
}

function patchEntry(threadID, patch) {
  const data = loadData();
  const tid  = String(threadID);
  data[tid]  = Object.assign({}, data[tid] || {}, patch);
  saveData(data);
  return data[tid];
}

// ════════════════════════════════════════════════════════════════
//  حساب وقت الانتظار وعرضه
// ════════════════════════════════════════════════════════════════

function getDelayMs(entry) {
  if (entry.mode === 'random') {
    const lo = entry.min * 60000;
    const hi = entry.max * 60000;
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  }
  return entry.interval * 60000;
}

function formatMode(entry) {
  if (!entry || !entry.mode) return 'غير محدد';
  if (entry.mode === 'random') return `عشوائي (${entry.min}–${entry.max} دقيقة)`;
  return `ثابت كل ${entry.interval} دقيقة`;
}

// ════════════════════════════════════════════════════════════════
//  نظام المؤقتات — recursive setTimeout
// ════════════════════════════════════════════════════════════════

if (!global._tawsi3) global._tawsi3 = {};

function stopTimer(threadID) {
  const tid = String(threadID);
  if (global._tawsi3[tid]) {
    clearTimeout(global._tawsi3[tid]);
    delete global._tawsi3[tid];
    console.log(`[توسيع] ⏹  إيقاف المؤقت: ${tid}`);
  }
}

function scheduleNext(api, threadID) {
  const tid = String(threadID);
  stopTimer(tid);  // دائماً أوقف القديم أولاً

  const entry = getEntry(tid);
  if (!entry || !entry.active) return;

  const delay    = getDelayMs(entry);
  const delayMin = (delay / 60000).toFixed(2);
  console.log(`[توسيع] ⏰ القروب ${tid} → إرسال بعد ${delayMin} دقيقة`);

  global._tawsi3[tid] = setTimeout(async () => {
    delete global._tawsi3[tid];

    // ── إرسال ──────────────────────────────────────────────────
    try {
      const cur = getEntry(tid);
      if (!cur || !cur.active) {
        console.log(`[توسيع] ⚠️  ${tid} أُوقف — لن يُرسل`);
        return;
      }

      await new Promise((resolve, reject) => {
        api.sendMessage(cur.message || '', tid, err => err ? reject(err) : resolve());
      });

      console.log(`[توسيع] ✅ تم الإرسال: ${tid}`);
    } catch(err) {
      console.error(`[توسيع] ❌ فشل الإرسال ${tid}:`, err?.error || err?.message || err);
      // لا نوقف — نكمل الجدولة
    }

    // ── جدوِل التالي دائماً ────────────────────────────────────
    try {
      const next = getEntry(tid);
      if (next?.active) scheduleNext(api, tid);
    } catch(e) {
      console.error(`[توسيع] ❌ خطأ في إعادة الجدولة ${tid}:`, e.message);
    }

  }, delay);
}

// ════════════════════════════════════════════════════════════════
//  استعادة المؤقتات عند إعادة تشغيل البوت
// ════════════════════════════════════════════════════════════════

function restoreAll(api) {
  try {
    const data = loadData();
    const tids = Object.keys(data).filter(t => data[t]?.active);
    if (tids.length === 0) return;
    setTimeout(() => {
      let n = 0;
      for (const tid of tids) {
        if (!global._tawsi3[tid]) { scheduleNext(api, tid); n++; }
      }
      if (n > 0) console.log(`[توسيع] 🔄 استُعيد ${n} مؤقت`);
    }, 5000);
  } catch(e) {
    console.error('[توسيع] ❌ خطأ في الاستعادة:', e.message);
  }
}

// ════════════════════════════════════════════════════════════════
//  التصدير
// ════════════════════════════════════════════════════════════════

module.exports.config = {
  name: "توسيع",
  version: "9.0.0",
  hasPermssion: 3,
  credits: "FANG",
  description: "إرسال رسائل تلقائية مستمرة بوقت ثابت أو عشوائي",
  commandCategory: "أدوات",
  usages: [
    "توسيع          ← تفعيل الإرسال",
    "توسيع وقت <دقائق>          ← ضبط وقت ثابت",
    "توسيع r <min-max>          ← ضبط وقت عشوائي",
    "توسيع تحديث رسالة <نص>    ← تحديث الرسالة",
    "توسيع كسر                 ← إيقاف الإرسال",
    "توسيع حالة                ← عرض الإعدادات"
  ].join('\n'),
  cooldowns: 3
};

module.exports.onLoad = function({ api } = {}) {
  if (!global._tawsi3) global._tawsi3 = {};
  if (api) restoreAll(api);
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const tid = String(threadID);
  const sub = (args[0] || '').trim();

  // ══════════════════════════════════════════════════════════════
  //  بدون أوامر فرعية ← تفعيل الإرسال
  // ══════════════════════════════════════════════════════════════
  if (!sub) {
    const entry = getEntry(tid);

    // التحقق من الإعداد
    if (!entry || !entry.mode) {
      return api.sendMessage(
        '⚠️ لم تُحدد مدة الإرسال بعد\n\n' +
        'اضبط الوقت أولاً:\n' +
        '• توسيع وقت 30       ← كل 30 دقيقة\n' +
        '• توسيع r 10-20      ← عشوائي بين 10 و20 دقيقة',
        threadID, messageID
      );
    }
    if (!entry.message || !entry.message.trim()) {
      return api.sendMessage(
        '⚠️ لم تُحدد رسالة التوسيع بعد\n\n' +
        'مثال: توسيع تحديث رسالة مرحباً بالجميع!',
        threadID, messageID
      );
    }
    if (entry.active) {
      return api.sendMessage(
        `⚠️ التوسيع مفعّل بالفعل!\n\n` +
        `⏱ ${formatMode(entry)}\n` +
        `💬 "${entry.message}"\n\n` +
        `للإيقاف: توسيع كسر`,
        threadID, messageID
      );
    }

    // تفعيل
    patchEntry(tid, { active: true });
    scheduleNext(api, tid);

    return api.sendMessage(
      `✅ تم تفعيل التوسيع!\n\n` +
      `⏱ ${formatMode(entry)}\n` +
      `💬 "${entry.message}"\n\n` +
      `للإيقاف: توسيع كسر`,
      threadID, messageID
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  وقت — ضبط وقت ثابت فقط (بدون تفعيل)
  // ══════════════════════════════════════════════════════════════
  if (sub === 'وقت') {
    const minutes = parseFloat(args[1]);

    if (isNaN(minutes) || minutes < MIN_INTERVAL || minutes > MAX_INTERVAL) {
      return api.sendMessage(
        `❌ اكتب وقتاً بين ${MIN_INTERVAL} و${MAX_INTERVAL} دقيقة\n\nمثال: توسيع وقت 30`,
        threadID, messageID
      );
    }

    const wasActive = getEntry(tid)?.active;

    // إذا كان نشطاً → أوقف وأعد الجدولة بالوقت الجديد
    if (wasActive) stopTimer(tid);

    patchEntry(tid, { mode: 'fixed', interval: minutes });

    if (wasActive) {
      scheduleNext(api, tid);
      return api.sendMessage(
        `✅ تم تحديث الوقت إلى ${minutes} دقيقة (ثابت)\n` +
        `ℹ️ المؤقت أُعيد تشغيله تلقائياً`,
        threadID, messageID
      );
    }

    return api.sendMessage(
      `✅ تم ضبط الوقت: كل ${minutes} دقيقة\n\n` +
      `اكتب "توسيع" للتفعيل`,
      threadID, messageID
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  r / ر — ضبط وقت عشوائي فقط (بدون تفعيل)
  // ══════════════════════════════════════════════════════════════
  if (sub === 'r' || sub === 'ر') {
    const range = (args[1] || '').trim();
    const match = range.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);

    if (!match) {
      return api.sendMessage(
        '❌ صيغة غير صحيحة\n\nمثال: توسيع r 10-20',
        threadID, messageID
      );
    }

    const minVal = parseFloat(match[1]);
    const maxVal = parseFloat(match[2]);

    if (minVal < MIN_INTERVAL || maxVal > MAX_INTERVAL || minVal >= maxVal) {
      return api.sendMessage(
        `❌ النطاق غير صحيح:\n` +
        `• الحد الأدنى: ${MIN_INTERVAL} دقيقة على الأقل\n` +
        `• الحد الأقصى: ${MAX_INTERVAL} دقيقة كحد أعلى\n` +
        `• الأدنى يجب أن يكون أصغر من الأقصى`,
        threadID, messageID
      );
    }

    const wasActive = getEntry(tid)?.active;
    if (wasActive) stopTimer(tid);

    patchEntry(tid, { mode: 'random', min: minVal, max: maxVal });

    if (wasActive) {
      scheduleNext(api, tid);
      return api.sendMessage(
        `✅ تم تحديث الوقت إلى عشوائي (${minVal}–${maxVal} دقيقة)\n` +
        `ℹ️ المؤقت أُعيد تشغيله تلقائياً`,
        threadID, messageID
      );
    }

    return api.sendMessage(
      `✅ تم ضبط الوقت: عشوائي بين ${minVal}–${maxVal} دقيقة\n\n` +
      `اكتب "توسيع" للتفعيل`,
      threadID, messageID
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  تحديث رسالة — تغيير نص الرسالة فقط
  // ══════════════════════════════════════════════════════════════
  if (sub === 'تحديث' && (args[1] || '').trim() === 'رسالة') {
    const message = args.slice(2).join(' ').trim();

    if (!message) {
      return api.sendMessage(
        '❌ اكتب نص الرسالة بعد الأمر\n\nمثال: توسيع تحديث رسالة مرحباً بالجميع!',
        threadID, messageID
      );
    }

    patchEntry(tid, { message });

    const entry = getEntry(tid);
    const status = entry?.active ? '✅ تم التحديث وسيُطبَّق في الإرسال القادم' : '✅ تم حفظ الرسالة';

    return api.sendMessage(
      `${status}\n\n💬 الرسالة الجديدة:\n"${message}"`,
      threadID, messageID
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  كسر — إيقاف الإرسال
  // ══════════════════════════════════════════════════════════════
  if (sub === 'كسر') {
    const entry = getEntry(tid);
    if (!entry?.active) {
      return api.sendMessage('⚠️ التوسيع غير مفعّل في هذا القروب', threadID, messageID);
    }

    stopTimer(tid);
    patchEntry(tid, { active: false });

    return api.sendMessage('✅ تم إيقاف التوسيع', threadID, messageID);
  }

  // ══════════════════════════════════════════════════════════════
  //  حالة — عرض الإعدادات الحالية
  // ══════════════════════════════════════════════════════════════
  if (sub === 'حالة') {
    const data   = loadData();
    const active = Object.entries(data).filter(([, e]) => e?.active);

    if (active.length === 0) {
      return api.sendMessage('📭 لا توجد قروبات مفعّلة حالياً', threadID, messageID);
    }

    const lines = active.map(([id, e], i) => {
      const live = global._tawsi3?.[id] ? '🟢' : '🔴';
      return (
        `${i + 1}. ${live} ${id}\n` +
        `   ⏱ ${formatMode(e)}\n` +
        `   💬 "${e.message || '—'}"`
      );
    });

    return api.sendMessage(
      `📊 القروبات النشطة (${active.length}):\n\n` + lines.join('\n\n'),
      threadID, messageID
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  تعليمات الاستخدام
  // ══════════════════════════════════════════════════════════════
  const entry      = getEntry(tid);
  const statusLine = entry
    ? `\n📌 الإعدادات الحالية:\n` +
      `   ⏱ ${formatMode(entry)}\n` +
      `   💬 "${entry.message || 'لم تُحدد بعد'}"\n` +
      `   حالة: ${entry.active ? '🟢 نشط' : '🔴 موقوف'}\n`
    : '';

  return api.sendMessage(
    `📖 أوامر التوسيع:\n${statusLine}\n` +
    `1️⃣  توسيع وقت <دقائق>\n` +
    `    مثال: توسيع وقت 30\n\n` +
    `2️⃣  توسيع r <min-max>\n` +
    `    مثال: توسيع r 10-20\n\n` +
    `3️⃣  توسيع تحديث رسالة <نص>\n` +
    `    مثال: توسيع تحديث رسالة مرحباً!\n\n` +
    `4️⃣  توسيع ← تفعيل الإرسال\n\n` +
    `5️⃣  توسيع كسر ← إيقاف الإرسال\n` +
    `6️⃣  توسيع حالة ← عرض القروبات النشطة`,
    threadID, messageID
  );
};
