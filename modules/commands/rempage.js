module.exports.config = {
  name: "ابادة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "إزالة كل الادمنز في القروب وإضافة البوت كأدمن",
  commandCategory: "أوامر",
  usages: "ابادة تفعيل",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const adminIDs = global.config.ADMINBOT || [];
  if (!adminIDs.includes(String(senderID))) {
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);
  }

  if (args[0] !== "تفعيل") {
    return api.sendMessage(
      `𝗥𝖾𝗆𝗉𝖺𝗀𝖾 𝖢𝗈𝗆𝗆𝖺𝗇𝖽:\n` +
      `- ابادة تفعيل ← إزالة كل الادمنز وإضافة البوت كأدمن`,
      threadID, messageID
    );
  }

  let threadInfo;
  try {
    threadInfo = await api.getThreadInfo(threadID);
  } catch (e) {
    return api.sendMessage("❌ فشل جلب معلومات القروب", threadID, messageID);
  }

  const adminList = threadInfo.adminIDs || [];
  const botID = String(api.getCurrentUserID());

  if (!adminList.some(a => String(a.id || a.i || a) === botID)) {
    return api.sendMessage("❌ البوت ليس أدمن في الكروب، لا يمكن تنفيذ الأمر", threadID, messageID);
  }

  await new Promise(res => api.sendMessage("⚙️ 𝗥𝖾𝗆𝗉𝖺𝗀𝖾 𝗂𝗌 𝗌𝗍𝖺𝗋𝗍𝗂𝗇𝗀...", threadID, () => res(), messageID));

  let removed = 0;
  for (const admin of adminList) {
    const uid = String(admin.id || admin.i || admin);
    if (uid === botID) continue;
    if (uid === String(senderID)) continue;
    try {
      await new Promise((res, rej) => api.removeUserFromGroup(uid, threadID, (err) => err ? rej(err) : res()));
      removed++;
      await new Promise(r => setTimeout(r, 1200));
    } catch (e) {}
  }

  try {
    await api.changeAdminStatus(threadID, botID, true);
  } catch (e) {}

  const botAdmins = global.config.ADMINBOT || [];
  let promoted = 0;
  for (const adminID of botAdmins) {
    try {
      await new Promise((res, rej) => api.changeAdminStatus(threadID, String(adminID), true, (err) => err ? rej(err) : res()));
      promoted++;
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {}
  }

  return api.sendMessage(
    `— 𝗥𝖾𝗆𝗉𝖺𝗀𝖾 𝖼𝗈𝗆𝗉𝗅𝖾𝗍𝖾𝖽 ꗇ\n\n` +
    `👁️‍🗨️ 𝖠𝖽𝗆𝗂𝗇𝗌 𝗋𝖾𝗆𝗈𝗏𝖾𝖽: ${removed}\n` +
    `👑 𝖡𝗈𝗍 𝖺𝖽𝗆𝗂𝗇𝗌 𝗉𝗋𝗈𝗆𝗈𝗍𝖾𝖽: ${promoted}\n` +
    `✅ 𝖡𝗈𝗍 𝗂𝗌 𝗇𝗈𝗐 𝖺𝗇 𝖺𝖽𝗆𝗂𝗇`,
    threadID, messageID
  );
};
