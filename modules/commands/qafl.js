const lockedCmds = global.lockedCmds || (global.lockedCmds = new Map());
// Map<threadID, Set<commandName>>

module.exports.config = {
  name: "قفل",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "قفل أو فتح أمر معين في الغروب",
  commandCategory: "النظام",
  usages: "قفل [اسم الأمر] | قفل فتح [اسم الأمر] | قفل عرض",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  if (!lockedCmds.has(threadID)) lockedCmds.set(threadID, new Set());
  const locked = lockedCmds.get(threadID);
  const sub = args[0];

  if (sub === "عرض") {
    if (!locked.size)
      return api.sendMessage("📭 لا توجد أوامر مقفلة في هذا الغروب", threadID, messageID);
    return api.sendMessage(
      `🔒 الأوامر المقفلة (${locked.size}):\n\n${[...locked].map((c,i)=>`${i+1}. ${c}`).join("\n")}`,
      threadID, messageID
    );
  }

  if (sub === "فتح") {
    const cmd = args.slice(1).join(" ").trim();
    if (!cmd) return api.sendMessage("❌ اكتب اسم الأمر المراد فتحه", threadID, messageID);
    if (!locked.has(cmd)) return api.sendMessage(`⚠️ الأمر "${cmd}" مو مقفل أصلاً`, threadID, messageID);
    locked.delete(cmd);
    return api.sendMessage(`✅ تم فتح الأمر "${cmd}"`, threadID, messageID);
  }

  if (sub === "فتح_كل") {
    locked.clear();
    return api.sendMessage("✅ تم فتح جميع الأوامر", threadID, messageID);
  }

  const cmdName = args.join(" ").trim();
  if (!cmdName) return api.sendMessage(
    "الاستخدام:\n• قفل [اسم الأمر] — قفل أمر\n• قفل فتح [اسم الأمر] — فتح أمر\n• قفل عرض — عرض المقفولات",
    threadID, messageID
  );

  const protectedCmds = ["قفل", "اغلاق", "ريستارت"];
  if (protectedCmds.includes(cmdName))
    return api.sendMessage(`❌ لا يمكن قفل الأمر "${cmdName}"`, threadID, messageID);

  locked.add(cmdName);
  return api.sendMessage(`🔒 تم قفل الأمر "${cmdName}" في هذا الغروب\nلفتحه: قفل فتح ${cmdName}`, threadID, messageID);
};
