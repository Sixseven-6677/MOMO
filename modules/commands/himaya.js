const himayaKoniyatAllData = global.himayaKoniyatAllData || (global.himayaKoniyatAllData = new Map());

module.exports.config = {
  name: "حماية",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "حماية كنيات جميع أعضاء الكروب من التغيير",
  commandCategory: "أوامر",
  usages: "حماية كنيات | حماية كنيات توقف",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const sub = args[0];

  // حماية كنيات
  if (sub === "كنيات") {
    const adminIDs = (global.config && global.config.ADMINBOT) || [];
    if (!adminIDs.includes(String(senderID)))
      return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

    // إيقاف الحماية
    if (args[1] === "توقف") {
      if (himayaKoniyatAllData.has(threadID)) {
        himayaKoniyatAllData.delete(threadID);
        return api.sendMessage("🛡 تم إيقاف حماية الكنيات", threadID, messageID);
      }
      return api.sendMessage("⚠️ حماية الكنيات مو شغالة أصلاً", threadID, messageID);
    }

    // تفعيل الحماية — التقط كنيات الكروب الحالية
    let snapshot = {};
    try {
      const info = await api.getThreadInfo(threadID);
      snapshot = info.nicknames || {};
    } catch (e) {}

    himayaKoniyatAllData.set(threadID, { snapshot });

    const count = Object.keys(snapshot).length;
    return api.sendMessage(
      `🛡 تم تفعيل حماية الكنيات\n` +
      `📸 تم حفظ ${count} كنية حالية\n` +
      `أي شخص يغير كنيته ترجع تلقائياً\n\n` +
      `للإيقاف: حماية كنيات توقف`,
      threadID, messageID
    );
  }

  // لو ما كتب subcommand
  return api.sendMessage(
    `🛡 أوامر الحماية:\n\n` +
    `• حماية كنيات — تفعيل حماية كنيات الكروب\n` +
    `• حماية كنيات توقف — إيقاف الحماية`,
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

  const protectedNick = snapshot.hasOwnProperty(changedUID) ? snapshot[changedUID] : undefined;
  const currentNick   = event.logMessageData?.nickname || null;

  // ما تغيرت
  if (currentNick === (protectedNick || null)) return;

  setTimeout(async () => {
    if (!himayaKoniyatAllData.has(threadID)) return;
    try {
      await api.changeNickname(protectedNick || "", threadID, changedUID);
    } catch (e) {}
  }, 2000);
};
