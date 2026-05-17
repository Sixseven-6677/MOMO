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
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw) || {};
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

function setEntry(threadID, entry) {
  const data = loadData();
  data[String(threadID)] = entry;
  saveData(data);
}

function clearEntry(threadID) {
  const data = loadData();
  if (data[String(threadID)]) {
    data[String(threadID)].active = false;
    saveData(data);
  }
}

// ════════════════════════════════════════════════════════════════
//  حساب وقت الانتظار
// ════════════════════════════════════════════════════════════════

function getDelayMs(entry) {
  if (entry.mode === 'random') {
    const minMs = entry.min * 60 * 1000;
    const maxMs = entry.max * 60 * 1000;
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  }
  return entry.interval * 60 * 1000;
}

function formatMode(entry) {
  if (entry.mode === 'random') {
    return `عشوائي بين ${entry.min}–${entry.max} دقيقة`;
  }
  return `ثابت كل ${entry.interval} دقيقة`;
}

// ════════════════════════════════════════════════════════════════
//  نظام المؤقتات — recursive setTimeout
// ════════════════════════════════════════════════════════════════

if (!global._tawsi3Timers) global._tawsi3Timers = {};

function stopTimer(threadID) {
  const tid = String(threadID);
  if (global._tawsi3Timers[tid]) {
    clearTimeout(global._tawsi3Timers[tid]);
    delete global._tawsi3Timers[tid];
    console.log(`[توسيع] ⏹  إيقاف المؤقت للقروب: ${tid}`);
  }
}

function scheduleNext(api, threadID) {
  const tid = String(threadID);

  // أوقف أي مؤقت سابق أولاً لتفادي التكرار
  stopTimer(tid);

  const entry = getEntry(tid);
  if (!entry || !entry.active) {
    console.log(`[توسيع] ℹ️  القروب ${tid} غير نشط — لن يُجدول`);
    return;
  }

  const delay    = getDelayMs(entry);
  const delayMin = (delay / 60000).toFixed(2);

  console.log(`[توسيع] ⏰ القروب ${tid} → إرسال بعد ${delayMin} دقيقة`);

  global._tawsi3Timers[tid] = setTimeout(async () => {
    delete global._tawsi3Timers[tid];

    // ── محاولة الإرسال ───────────────────────────────────────────
    try {
      const current = getEntry(tid);
      if (!current || !current.active) {
        console.log(`[توسيع] ⚠️  القروب ${tid} أُوقف قبل الإرسال — إلغاء`);
        return;
      }

      await new Promise((resolve, reject) => {
        api.sendMessage(current.message, tid, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`[توسيع] ✅ تم الإرسال بنجاح في القروب ${tid}`);

    } catch(err) {
      console.error(
        `[توسيع] ❌ فشل الإرسال في القروب ${tid}:`,
        err?.error || err?.message || err
      );
      // لا نوقف النظام — نكمل للجدولة التالية
    }

    // ── جدوِل الإرسال التالي دائماً (حتى لو حدث خطأ) ─────────────
    try {
      const next = getEntry(tid);
      if (next?.active) {
        scheduleNext(api, tid);
      } else {
        console.log(`[توسيع] 🔕 القروب ${tid} انتهى — لن يُعاد الجدولة`);
      }
    } catch(e) {
      console.error(`[توسيع] ❌ خطأ في إعادة الجدولة للقروب ${tid}:`, e.message);
    }

  }, delay);
}

// ════════════════════════════════════════════════════════════════
//  استعادة المؤقتات عند إعادة تشغيل البوت
// ════════════════════════════════════════════════════════════════

function restoreAll(api) {
  try {
    const data  = loadData();
    const tids  = Object.keys(data).filter(tid => data[tid]?.active);
    if (tids.length === 0) return;

    // أخّر الاستعادة قليلاً حتى يستقر الاتصال
    setTimeout(() => {
      let restored = 0;
      for (const tid of tids) {
        if (!global._tawsi3Timers[tid]) {
          scheduleNext(api, tid);
          restored++;
        }
      }
      if (restored > 0) {
        console.log(`[توسيع] 🔄 استُعيد ${restored} مؤقت بعد إعادة التشغيل`);
      }
    }, 5000);
  } catch(e) {
    console.error('[توسيع] ❌ خطأ في استعادة المؤقتات:', e.message);
  }
}

// ════════════════════════════════════════════════════════════════
//  التصدير
// ════════════════════════════════════════════════════════════════

module.exports.config = {
  name: "توسيع",
  version: "8.0.0",
  hasPermssion: 3,
  credits: "FANG",
  description: "إرسال رسائل تلقائية بشكل مستمر بوقت ثابت أو عشوائي",
  commandCategory: "أدوات",
  usages: "توسيع وقت <دقائق> <رسالة> | توسيع r <min-max> <رسالة> | توسيع كسر | توسيع حالة",
  cooldowns: 3
};

// ── تشغيل عند تحميل البوت ────────────────────────────────────────
module.exports.onLoad = function({ api } = {}) {
  if (!global._tawsi3Timers) global._tawsi3Timers = {};
  if (api) restoreAll(api);
};

// ── الأمر الرئيسي ────────────────────────────────────────────────
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const tid = String(threadID);
  const sub = (args[0] || '').trim();

  // ══════════════════════════════════════════════
  //  حالة — عرض كل القروبات النشطة
  // ══════════════════════════════════════════════
  if (sub === 'حالة') {
    const data   = loadData();
    const active = Object.entries(data).filter(([, e]) => e?.active);

    if (active.length === 0) {
      return api.sendMessage('📭 لا توجد قروبات مفعّلة حالياً', threadID, messageID);
    }

    const lines = active.map(([id, e], i) => {
      const inMem = global._tawsi3Timers?.[id] ? '🟢' : '🟡';
      return (
        `${i + 1}. ${inMem} القروب: ${id}\n` +
        `   ⏱ ${formatMode(e)}\n` +
        `   💬 "${e.message}"`
      );
    });

    return api.sendMessage(
      `📊 القروبات النشطة (${active.length}):\n\n` + lines.join('\n\n'),
      threadID, messageID
    );
  }

  // ══════════════════════════════════════════════
  //  كسر — إيقاف الإرسال
  // ══════════════════════════════════════════════
  if (sub === 'كسر') {
    const entry = getEntry(tid);
    if (!entry || !entry.active) {
      return api.sendMessage('⚠️ التوسيع غير مفعّل في هذا القروب', threadID, messageID);
    }

    stopTimer(tid);
    clearEntry(tid);

    return api.sendMessage(
      '✅ تم إيقاف التوسيع في هذا القروب بنجاح',
      threadID, messageID
    );
  }

  // ══════════════════════════════════════════════
  //  وقت — وقت ثابت
  // ══════════════════════════════════════════════
  if (sub === 'وقت') {
    const minutes = parseFloat(args[1]);
    const message = args.slice(2).join(' ').trim();

    if (isNaN(minutes) || minutes < MIN_INTERVAL || minutes > MAX_INTERVAL) {
      return api.sendMessage(
        `❌ الوقت يجب أن يكون بين ${MIN_INTERVAL} و${MAX_INTERVAL} دقيقة\n\n` +
        `مثال: توسيع وقت 30 مرحباً بالجميع!`,
        threadID, messageID
      );
    }
    if (!message) {
      return api.sendMessage(
        '❌ يجب كتابة الرسالة بعد الوقت\n\nمثال: توسيع وقت 30 مرحباً!',
        threadID, messageID
      );
    }

    // إيقاف القديم إن كان نشطاً
    stopTimer(tid);

    const entry = {
      active:    true,
      mode:      'fixed',
      interval:  minutes,
      message,
      threadID:  tid,
      startedAt: Date.now()
    };
    setEntry(tid, entry);
    scheduleNext(api, tid);

    return api.sendMessage(
      `✅ تم تفعيل التوسيع الثابت!\n\n` +
      `⏱ الوقت: كل ${minutes} دقيقة\n` +
      `💬 الرسالة: "${message}"\n\n` +
      `للإيقاف: توسيع كسر`,
      threadID, messageID
    );
  }

  // ══════════════════════════════════════════════
  //  r / ر — وقت عشوائي
  // ══════════════════════════════════════════════
  if (sub === 'r' || sub === 'ر') {
    const range   = (args[1] || '').trim();
    const message = args.slice(2).join(' ').trim();
    const match   = range.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);

    if (!match) {
      return api.sendMessage(
        '❌ صيغة النطاق غير صحيحة\n\n' +
        'مثال: توسيع r 10-20 أهلاً وسهلاً!',
        threadID, messageID
      );
    }

    const minVal = parseFloat(match[1]);
    const maxVal = parseFloat(match[2]);

    if (minVal < MIN_INTERVAL) {
      return api.sendMessage(
        `❌ الحد الأدنى لا يقل عن ${MIN_INTERVAL} دقيقة`,
        threadID, messageID
      );
    }
    if (maxVal > MAX_INTERVAL) {
      return api.sendMessage(
        `❌ الحد الأقصى لا يتجاوز ${MAX_INTERVAL} دقيقة`,
        threadID, messageID
      );
    }
    if (minVal >= maxVal) {
      return api.sendMessage(
        '❌ الحد الأدنى يجب أن يكون أصغر من الحد الأقصى\n\nمثال: توسيع r 10-20 رسالة',
        threadID, messageID
      );
    }
    if (!message) {
      return api.sendMessage(
        '❌ يجب كتابة الرسالة بعد النطاق\n\nمثال: توسيع r 10-20 أهلاً!',
        threadID, messageID
      );
    }

    // إيقاف القديم إن كان نشطاً
    stopTimer(tid);

    const entry = {
      active:    true,
      mode:      'random',
      min:       minVal,
      max:       maxVal,
      message,
      threadID:  tid,
      startedAt: Date.now()
    };
    setEntry(tid, entry);
    scheduleNext(api, tid);

    return api.sendMessage(
      `✅ تم تفعيل التوسيع العشوائي!\n\n` +
      `⏱ الوقت: عشوائي بين ${minVal}–${maxVal} دقيقة\n` +
      `💬 الرسالة: "${message}"\n\n` +
      `للإيقاف: توسيع كسر`,
      threadID, messageID
    );
  }

  // ══════════════════════════════════════════════
  //  تعليمات الاستخدام
  // ══════════════════════════════════════════════
  const currentEntry = getEntry(tid);
  const statusLine   = currentEntry?.active
    ? `\n📌 الحالة الحالية في هذا القروب: نشط (${formatMode(currentEntry)})\n`
    : '';

  return api.sendMessage(
    `📖 طريقة استخدام التوسيع:\n${statusLine}\n` +
    `🔹 وقت ثابت:\n` +
    `   توسيع وقت <دقائق> <رسالة>\n` +
    `   مثال: توسيع وقت 30 مرحباً بالجميع!\n\n` +
    `🔹 وقت عشوائي:\n` +
    `   توسيع r <min-max> <رسالة>\n` +
    `   مثال: توسيع r 10-20 أهلاً وسهلاً!\n\n` +
    `🔹 توسيع كسر — إيقاف الإرسال\n` +
    `🔹 توسيع حالة — عرض القروبات النشطة`,
    threadID, messageID
  );
};
