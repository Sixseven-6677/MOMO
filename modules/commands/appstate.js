const fs   = require('fs');
const path = require('path');

const APPSTATE_PATH = path.join(process.cwd(), 'appstate.json');
const BACKUP_PATH   = path.join(process.cwd(), 'appstate.backup.json');
const MANUAL_FLAG   = path.join(process.cwd(), 'appstate.manual');

function rawStringToAppstate(rawStr) {
  const now = new Date().toISOString();
  const parts = rawStr.split(';').map(c => c.trim()).filter(c => c.length > 0);
  return parts.map(part => {
    const eq = part.indexOf('=');
    if (eq === -1) return null;
    const key = part.substring(0, eq).trim();
    const value = part.substring(eq + 1).trim();
    if (!key) return null;
    return { key, value, domain: '.facebook.com', path: '/', hostOnly: false, creation: now, lastAccessed: now };
  }).filter(Boolean);
}

module.exports.config = {
  name: 'كوكيز',
  version: '6.0.0',
  hasPermssion: 0,
  credits: 'MOMO',
  description: 'تغيير حساب البوت عبر الكوكيز — يُعيد التشغيل فوراً',
  commandCategory: 'أوامر',
  usages: 'كوكيز {نص خام أو JSON} | كوكيز (ردّ على رسالة)',
  cooldowns: 0
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply } = event;

  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage('❌ هذا الأمر لأدمن البوت فقط', threadID, messageID);

  let rawInput = '';
  if (messageReply && messageReply.body) rawInput = messageReply.body.trim();
  else if (args.length > 0) rawInput = args.join(' ').trim();

  if (!rawInput) {
    let currentID = '؟';
    try { currentID = api.getCurrentUserID(); } catch (e) {}
    const hasBackup = fs.existsSync(BACKUP_PATH);
    return api.sendMessage(
      '📋 أمر الكوكيز\n\n' +
      '👤 الحساب الحالي: ' + currentID + '\n' +
      '💾 نسخة احتياطية: ' + (hasBackup ? '✅ موجودة' : '❌ لا توجد') + '\n\n' +
      '━━━━━━━━━━━━━━━\n' +
      '📌 طريقتان لإرسال الكوكيز:\n\n' +
      '1️⃣ نص خام:\n' +
      '   كوكيز c_user=xxx; xs=xxx; datr=xxx\n\n' +
      '2️⃣ صيغة JSON:\n' +
      '   كوكيز [{"key":"c_user","value":"xxx",...}]\n\n' +
      '💡 أو أرسل الكوكيز في رسالة وردّ عليها بـ: كوكيز\n\n' +
      '⚠️ البوت يعيد تشغيله تلقائياً بعد التغيير',
      threadID, messageID
    );
  }

  let parsed = [];
  const looksLikeJson = rawInput.trimStart().startsWith('[') || rawInput.trimStart().startsWith('{');

  if (looksLikeJson) {
    try {
      const cleaned = rawInput.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
      let tmp = JSON.parse(cleaned);
      if (!Array.isArray(tmp)) {
        if (Array.isArray(tmp.cookies)) tmp = tmp.cookies;
        else if (Array.isArray(tmp.AppState)) tmp = tmp.AppState;
        else throw new Error('القيمة يجب أن تكون مصفوفة كوكيز');
      }
      if (tmp.length === 0) throw new Error('المصفوفة فارغة');
      parsed = tmp;
    } catch (e) {
      return api.sendMessage(
        '❌ خطأ في تحليل JSON:\n' + e.message + '\n\n' +
        'أو أرسل الكوكيز كنص خام:\n' +
        'كوكيز c_user=xxx; xs=xxx; datr=xxx',
        threadID, messageID
      );
    }
  } else {
    parsed = rawStringToAppstate(rawInput);
    if (parsed.length === 0) {
      return api.sendMessage(
        '❌ لم أتمكن من قراءة الكوكيز!\n\n' +
        'تأكد من الصيغة:\n' +
        'c_user=xxx; xs=xxx; datr=xxx; ...',
        threadID, messageID
      );
    }
  }

  const keys = parsed.map(c => (c.key || c.name || '').toLowerCase());
  if (!keys.some(k => k === 'c_user') || !keys.some(k => k === 'xs')) {
    return api.sendMessage(
      '❌ الكوكيز لا تبدو صحيحة!\n\n' +
      'لم يُعثر على "c_user" و"xs".\n' +
      'تأكد أنها كوكيز فيسبوك حقيقية وغير منتهية الصلاحية.',
      threadID, messageID
    );
  }

  // نسخة احتياطية
  try {
    if (fs.existsSync(APPSTATE_PATH)) fs.copyFileSync(APPSTATE_PATH, BACKUP_PATH);
  } catch (e) {}

  // حفظ الكوكيز الجديدة
  try {
    fs.writeFileSync(APPSTATE_PATH, JSON.stringify(parsed, null, 2), 'utf8');
  } catch (e) {
    return api.sendMessage('❌ فشل حفظ الكوكيز:\n' + e.message, threadID, messageID);
  }

  // ملف العلم — يمنع main.js من تجاوز الكوكيز بقيمة APPSTATE_JSON عند إعادة التشغيل
  try {
    fs.writeFileSync(MANUAL_FLAG, '1', 'utf8');
  } catch (e) {}

  const cUser = parsed.find(c => (c.key || c.name || '').toLowerCase() === 'c_user');
  const accountHint = cUser ? '\n👤 المعرّف: ' + (cUser.value || cUser.val || '؟') : '';

  await api.sendMessage(
    '✅ تم حفظ الكوكيز! (' + parsed.length + ' كوكي)' + accountHint + '\n\n' +
    '⏳ البوت يُعيد تشغيله الآن...\n' +
    'انتظر 15-20 ثانية ثم جرّب أي أمر',
    threadID, messageID
  );

  setTimeout(() => process.exit(1), 1500);
};
