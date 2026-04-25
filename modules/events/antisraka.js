module.exports.config = {
  name: "antisraka",
  eventType: ["log:thread-admins"],
  version: "2.0.0",
  credits: "XAVIER",
  description: "حماية فورية: إذا أزال أي شخص (غير أدمن البوت) أدمن من القروب يُطرد فوراً 0s. تتفعّل تلقائياً إذا كان البوت أدمن في القروب."
};

module.exports.run = async function({ api, event }) {
  try {
    const { logMessageData, threadID, author } = event;
    if (!logMessageData || logMessageData.ADMIN_EVENT !== "remove_admin") return;

    const botID = String(api.getCurrentUserID());
    const adminBotIDs = (global.config.ADMINBOT || []).map(String);
    const authorStr = String(author);

    // Never act against the bot itself or any of its registered admins
    if (authorStr === botID) return;
    if (adminBotIDs.includes(authorStr)) return;

    // Feature only activates when the bot is an admin in this group
    let threadInfo = null;
    try { threadInfo = await api.getThreadInfo(threadID); } catch (e) { return; }
    if (!threadInfo || !Array.isArray(threadInfo.adminIDs)) return;
    const botIsAdmin = threadInfo.adminIDs.some(a => String(a.id) === botID);
    if (!botIsAdmin) return;

    // Resolve attacker name (best-effort, must not delay the kick)
    let attackerName = authorStr;
    api.getUserInfo(authorStr, (err, info) => {
      if (!err && info && info[authorStr] && info[authorStr].name) {
        attackerName = info[authorStr].name;
      }
    });

    // Immediate kick — no setTimeout, no awaiting heavy calls before this
    api.removeUserFromGroup(authorStr, threadID, (err) => {
      if (err) {
        api.sendMessage(
          `⚠️ 𝑨𝑵𝑻𝑰 𝑺𝑹𝑨𝑲𝑨\nمحاولة تخريب من ${attackerName} (${authorStr})\n❌ فشل الطرد — تأكد أن البوت أدمن وليس مستهدفاً نفسه`,
          threadID
        );
        return;
      }
      api.sendMessage(
        `⚠️ 𝑿𝑨𝑽𝑰𝑬𝑹 ᚔ 𝑨𝑵𝑻𝑰 𝑺𝑹𝑨𝑲𝑨\n\n` +
        `🚫 تم طرد: ${attackerName} (${authorStr})\n` +
        `📋 السبب: محاولة إزالة أدمن من القروب\n` +
        `🛡 استجابة فورية — تم حماية القروب`,
        threadID
      );
    });
  } catch (e) {}
};
