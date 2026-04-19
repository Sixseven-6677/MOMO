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
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "قائمة القروبات التي يوجد فيها البوت مع التحكم بكل قروب",
  commandCategory: "أوامر",
  usages: "قروبات | قروبات تعطيل [رقم] | قروبات تفعيل [رقم]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const adminIDs = global.config.ADMINBOT || [];
  if (!adminIDs.includes(String(senderID))) {
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);
  }

  const allThreads = [...global.data.allThreadID];
  const disabled = getDisabled();

  if (!args[0] || args[0] === "لستة") {
    if (allThreads.length === 0)
      return api.sendMessage("ما في قروبات مسجلة حالياً", threadID, messageID);

    let lines = [];
    let i = 1;
    for (const tid of allThreads) {
      let name = tid;
      try {
        const info = global.data.threadInfo.get(tid) || await api.getThreadInfo(tid);
        name = info.threadName || `قروب ${tid}`;
      } catch (e) {}
      const status = disabled.includes(tid) ? "🔴 معطّل" : "🟢 مفعّل";
      lines.push(`${i}. ${name}\n   ${status}`);
      i++;
    }

    return api.sendMessage(
      `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n` +
      `➢︱ 𝑿𝑨𝑽𝑰𝑬𝑹 ᚔ 𝑮𝑹𝑶𝑼𝑷𝑺 ︱⚕\n` +
      `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n\n` +
      lines.join("\n\n") +
      `\n\n⧺ إجمالي القروبات: ${allThreads.length} ⧺`,
      threadID, messageID
    );
  }

  if (args[0] === "تعطيل" || args[0] === "تفعيل") {
    const num = parseInt(args[1]);
    if (isNaN(num) || num < 1 || num > allThreads.length) {
      return api.sendMessage(
        `❌ رقم غير صحيح، البوت في ${allThreads.length} قروب`,
        threadID, messageID
      );
    }

    const targetThread = allThreads[num - 1];
    let name = targetThread;
    try {
      const info = global.data.threadInfo.get(targetThread) || await api.getThreadInfo(targetThread);
      name = info.threadName || targetThread;
    } catch (e) {}

    if (args[0] === "تعطيل") {
      if (!disabled.includes(targetThread)) disabled.push(targetThread);
      saveDisabled(disabled);
      global.data.threadBanned.set(targetThread, { reason: "معطّل من الأدمن", dateAdded: new Date().toLocaleString() });
      return api.sendMessage(
        `🔴 تم تعطيل البوت في:\n${name}\nالبوت لن يرد في هذا القروب\n\nللتفعيل: قروبات تفعيل ${num}`,
        threadID, messageID
      );
    }

    if (args[0] === "تفعيل") {
      const updated = disabled.filter(id => id !== targetThread);
      saveDisabled(updated);
      global.data.threadBanned.delete(targetThread);
      return api.sendMessage(
        `🟢 تم تفعيل البوت في:\n${name}\nالبوت يرد الآن في هذا القروب`,
        threadID, messageID
      );
    }
  }

  return api.sendMessage(
    `📋 أوامر القروبات:\n\nقروبات ← عرض جميع القروبات وحالتها\nقروبات تعطيل [رقم] ← البوت لا يرد في هذا القروب\nقروبات تفعيل [رقم] ← البوت يرد في هذا القروب`,
    threadID, messageID
  );
};
