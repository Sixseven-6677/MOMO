const himayaKoniyatData = global.himayaKoniyatData || (global.himayaKoniyatData = new Map());

module.exports.config = {
  name: "حمايةكنية",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "حماية كنية شخص معين في الكروب من التغيير",
  commandCategory: "أوامر",
  usages: "حمايةكنية [الكنية] | حمايةكنية توقف",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const key = `${threadID}_${senderID}`;

  if (args[0] === "توقف") {
    if (himayaKoniyatData.has(key)) {
      himayaKoniyatData.delete(key);
      return api.sendMessage("🛡 تم إيقاف حماية الكنية", threadID, messageID);
    }
    return api.sendMessage("حماية الكنية مو شغالة أصلاً", threadID, messageID);
  }

  let nicknameToProtect;

  if (args[0]) {
    nicknameToProtect = args.join(" ");
    try {
      await api.changeNickname(nicknameToProtect, threadID, senderID);
    } catch (e) {}
  } else {
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const member = (threadInfo.nicknames || {})[senderID];
      nicknameToProtect = member || null;
    } catch (e) {}
  }

  if (!nicknameToProtect) {
    return api.sendMessage(
      "❌ ما عندك كنية حالية، اكتب الكنية بعد الأمر\nمثال: حمايةكنية [الكنية المطلوبة]",
      threadID, messageID
    );
  }

  himayaKoniyatData.set(key, { threadID, senderID, nickname: nicknameToProtect });

  return api.sendMessage(
    `🛡 تم تفعيل حماية الكنية\n📝 الكنية المحمية: ${nicknameToProtect}\nأي شخص يغيرها سترجع تلقائياً\n\nللإيقاف: حمايةكنية توقف`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  if (event.logMessageType !== "log:user-nickname") return;
  const { threadID } = event;

  const changedUID = String(event.logMessageData?.participant_id || "");
  if (!changedUID) return;

  const key = `${threadID}_${changedUID}`;
  if (!himayaKoniyatData.has(key)) return;

  const { nickname } = himayaKoniyatData.get(key);
  if (event.logMessageData?.nickname === nickname) return;

  setTimeout(async () => {
    if (!himayaKoniyatData.has(key)) return;
    try {
      await api.changeNickname(nickname, threadID, changedUID);
    } catch (e) {}
  }, 2000);
};
