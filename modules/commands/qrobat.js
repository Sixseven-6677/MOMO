const fs = require("fs");
const path = require("path");
const disabledPath = path.join(__dirname, "cache/disabled_threads.json");

function getDisabled() {
  try {
    if (fs.existsSync(disabledPath)) return JSON.parse(fs.readFileSync(disabledPath, "utf8"));
  } catch (e) {}
  return [];
}

function saveDisabled(list) {
  fs.writeFileSync(disabledPath, JSON.stringify(list, null, 2), "utf8");
}

module.exports.config = {
  name: "قروبات",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "قائمة القروبات الحالية للبوت مع التحكم بكل قروب",
  commandCategory: "أوامر",
  usages: "قروبات | قروبات تعطيل [رقم] | قروبات تفعيل [رقم] | قروبات اضافة [رقم]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const adminIDs = global.config.ADMINBOT || [];
  if (!adminIDs.includes(String(senderID))) {
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);
  }

  const disabled = getDisabled();

  if (!args[0] || args[0] === "لستة") {
    // جلب القروبات الحالية من API مباشرة (لحظي)
    let currentThreads = [];
    try {
      const threadList = await api.getThreadList(100, null, ["INBOX"]);
      currentThreads = threadList.filter(t => t.isGroup);
    } catch (e) {
      // fallback to global data if API fails
      currentThreads = [...(global.data.allThreadID || [])].map(id => ({ threadID: id, name: null }));
    }

    if (currentThreads.length === 0)
      return api.sendMessage("ما في قروبات حالياً", threadID, messageID);

    let lines = [];
    let i = 1;
    for (const t of currentThreads) {
      const tid = t.threadID || t;
      let name = t.name || t.threadName || tid;
      if (!name || name === tid) {
        try {
          const info = global.data.threadInfo?.get(String(tid)) || await api.getThreadInfo(tid);
          name = info.threadName || `قروب ${tid}`;
        } catch (e) { name = `قروب ${tid}`; }
      }
      const status = disabled.includes(String(tid)) ? "🔴 معطّل" : "🟢 مفعّل";
      lines.push(`${i}. ${name}\n   ${status}`);
      i++;
    }

    // حفظ القائمة الحالية مؤقتاً للأوامر التالية
    global._currentThreads = currentThreads;

    return api.sendMessage(
      `📋 قروبات البوت الحالية (${currentThreads.length})\n\n` +
      lines.join("\n\n"),
      threadID, messageID
    );
  }

  // استخدم القائمة المؤقتة أو allThreadID كـ fallback
  const allThreads = (global._currentThreads || []).map(t => t.threadID || t);
  const fallback = allThreads.length > 0 ? allThreads : [...(global.data.allThreadID || [])];

  if (args[0] === "تعطيل" || args[0] === "تفعيل") {
    const num = parseInt(args[1]);
    if (isNaN(num) || num < 1 || num > fallback.length) {
      return api.sendMessage(
        `❌ رقم غير صحيح، اكتب قروبات أولاً لتحديث القائمة`,
        threadID, messageID
      );
    }

    const targetThread = String(fallback[num - 1]);
    let name = targetThread;
    try {
      const info = global.data.threadInfo?.get(targetThread) || await api.getThreadInfo(targetThread);
      name = info.threadName || targetThread;
    } catch (e) {}

    if (args[0] === "تعطيل") {
      if (!disabled.includes(targetThread)) disabled.push(targetThread);
      saveDisabled(disabled);
      if (global.data.threadBanned) global.data.threadBanned.set(targetThread, { reason: "معطّل من الأدمن", dateAdded: new Date().toLocaleString() });
      return api.sendMessage(
        `🔴 تم تعطيل البوت في:\n${name}\nللتفعيل: قروبات تفعيل ${num}`,
        threadID, messageID
      );
    }

    if (args[0] === "تفعيل") {
      const updated = disabled.filter(id => id !== targetThread);
      saveDisabled(updated);
      if (global.data.threadBanned) global.data.threadBanned.delete(targetThread);
      return api.sendMessage(
        `🟢 تم تفعيل البوت في:\n${name}`,
        threadID, messageID
      );
    }
  }

  if (args[0] === "اضافة") {
    const num = parseInt(args[1]);
    if (isNaN(num) || num < 1 || num > fallback.length) {
      return api.sendMessage(
        `❌ رقم غير صحيح، اكتب قروبات أولاً لتحديث القائمة`,
        threadID, messageID
      );
    }

    const targetThread = fallback[num - 1];
    let name = targetThread;
    try {
      const info = global.data.threadInfo?.get(String(targetThread)) || await api.getThreadInfo(targetThread);
      name = info.threadName || targetThread;
    } catch (e) {}

    try {
      await api.addUserToGroup(senderID, targetThread);
      return api.sendMessage(`✅ تم إضافتك بنجاح إلى:\n${name}`, threadID, messageID);
    } catch (e) {
      return api.sendMessage(
        `❌ فشل الإضافة إلى: ${name}`,
        threadID, messageID
      );
    }
  }

  return api.sendMessage(
    `📋 أوامر القروبات:\n\n` +
    `قروبات ← عرض القروبات الحالية\n` +
    `قروبات تعطيل [رقم] ← البوت لا يرد في هذا القروب\n` +
    `قروبات تفعيل [رقم] ← البوت يرد في هذا القروب\n` +
    `قروبات اضافة [رقم] ← يضيفك للقروب فوراً`,
    threadID, messageID
  );
};
