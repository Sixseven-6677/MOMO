const himayaKoniyatAllData = global.himayaKoniyatAllData || (global.himayaKoniyatAllData = new Map());

module.exports.config = {
  name: "حمايةكنيات",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "حماية كنيات جميع أعضاء الكروب من التغيير",
  commandCategory: "أوامر",
  usages: "حمايةكنيات | حمايةكنيات توقف",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  if (args[0] === "توقف") {
    if (himayaKoniyatAllData.has(threadID)) {
      himayaKoniyatAllData.delete(threadID);
      return api.sendMessage("🛡 تم إيقاف حماية الكنيات للكروب", threadID, messageID);
    }
    return api.sendMessage("⚠️ حماية الكنيات مو شغالة أصلاً", threadID, messageID);
  }

  let snapshot = {};
  try {
    const info = await api.getThreadInfo(threadID);
    snapshot = info.nicknames || {};
  } catch (e) {}

  himayaKoniyatAllData.set(threadID, { snapshot });

  const count = Object.keys(snapshot).length;
  return api.sendMessage(
    `🛡 تم تفعيل حماية كنيات الكروب\n` +
    `📸 تم حفظ ${count} كنية حالية\n` +
    `أي شخص يغير كنيته ترجع تلقائياً\n\n` +
    `للإيقاف: حمايةكنيات توقف`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  if (event.logMessageType !== "log:user-nickname") return;
  const { threadID } = event;

  if (!himayaKoniyatAllData.has(threadID)) return;

  const { snapshot } = himayaKoniyatAllData.get(threadID);
  const changedUID = String(event.logMessageData?.participant_id || "");
  if (!changedUID) return;

  const protectedNick = snapshot[changedUID] || null;
  const currentNick   = event.logMessageData?.nickname || null;

  // لو الكنية الجديدة مختلفة عن المحفوظة — أرجعها
  if (currentNick === protectedNick) return;

  setTimeout(async () => {
    if (!himayaKoniyatAllData.has(threadID)) return;
    try {
      await api.changeNickname(protectedNick || "", threadID, changedUID);
    } catch (e) {}
  }, 2000);
};
