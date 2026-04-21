const koniyatIntervals = global.koniyatIntervals || (global.koniyatIntervals = new Map());
const himayaKoniyatData = global.himayaKoniyatData || (global.himayaKoniyatData = new Map());

module.exports.config = {
  name: "كنيات",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "تغيير كنيات جميع أعضاء الكروب مع حماية الكنية",
  commandCategory: "أوامر",
  usages: "كنيات [الاسم] | كنيات توقف | كنيات حماية [الكنية] | كنيات حماية لا",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const key = `${threadID}_${senderID}`;

  if (!args[0]) {
    return api.sendMessage(
      `𝗡𝗂𝖼𝗄𝗇𝖺𝗆𝖾𝗌 𝖢𝗈𝗆𝗆𝖺𝗇𝖽𝗌:\n` +
      `- كنيات [الاسم] ← تغيير كنيات الجميع\n` +
      `- كنيات توقف ← إيقاف التغيير\n` +
      `- كنيات حماية [الكنية] ← حماية كنيتك من التغيير\n` +
      `- كنيات حماية لا ← إيقاف حماية كنيتك`,
      threadID, messageID
    );
  }

  if (args[0] === "توقف") {
    if (koniyatIntervals.has(threadID)) {
      clearTimeout(koniyatIntervals.get(threadID));
      koniyatIntervals.delete(threadID);
      return api.sendMessage("— 𝖭𝗂𝖼𝗄𝗇𝖺𝗆𝖾𝗌 𝖼𝗁𝖺𝗇𝗀𝖾 𝗁𝖺𝗌 𝖻𝖾𝖾𝗇 𝗌𝗍𝗈𝗉𝗉𝖾𝖽 ꗇ", threadID, messageID);
    }
    return api.sendMessage("⚠️ ما في شيء شغال أصلاً", threadID, messageID);
  }

  if (args[0] === "حماية") {
    if (args[1] === "لا") {
      if (himayaKoniyatData.has(key)) {
        himayaKoniyatData.delete(key);
        return api.sendMessage("— 𝖭𝗂𝖼𝗄𝗇𝖺𝗆𝖾 𝗉𝗋𝗈𝗍𝖾𝖼𝗍𝗂𝗈𝗇 𝗁𝖺𝗌 𝖻𝖾𝖾𝗇 𝖽𝗂𝗌𝖺𝖻𝗅𝖾𝖽 ꗇ", threadID, messageID);
      }
      return api.sendMessage("⚠️ حماية الكنية مو شغالة أصلاً", threadID, messageID);
    }

    let nicknameToProtect;
    if (args[1]) {
      nicknameToProtect = args.slice(1).join(" ");
      try { await api.changeNickname(nicknameToProtect, threadID, senderID); } catch (e) {}
    } else {
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        nicknameToProtect = (threadInfo.nicknames || {})[senderID] || null;
      } catch (e) {}
    }

    if (!nicknameToProtect) {
      return api.sendMessage(
        "❌ ما عندك كنية حالية، اكتب الكنية بعد الأمر\nمثال: كنيات حماية XAVIER",
        threadID, messageID
      );
    }

    himayaKoniyatData.set(key, { threadID, senderID, nickname: nicknameToProtect });
    return api.sendMessage(
      `— 𝖭𝗂𝖼𝗄𝗇𝖺𝗆𝖾 𝗉𝗋𝗈𝗍𝖾𝖼𝗍𝗂𝗈𝗇 𝗁𝖺𝗌 𝖻𝖾𝖾𝗇 𝖺𝖼𝗍𝗂𝗏𝖺𝗍𝖾𝖽 ꗇ\n\n𝖯𝗋𝗈𝗍𝖾𝖼𝗍𝖾𝖽 𝗇𝗂𝖼𝗄𝗇𝖺𝗆𝖾: ${nicknameToProtect}\n\n☢️ 𝖠𝗇𝗒𝗈𝗇𝖾 𝗐𝗁𝗈 𝖼𝗁𝖺𝗇𝗀𝖾𝗌 𝗒𝗈𝗎𝗋 𝗇𝗂𝖼𝗄𝗇𝖺𝗆𝖾 𝗐𝗂𝗅𝗅 𝗁𝖺𝗏𝖾 𝗂𝗍 𝗋𝖾𝗏𝖾𝗋𝗍𝖾𝖽\n\n𝖥𝗈𝗋 𝗌𝗍𝗈𝗉𝗉𝗂𝗇𝗀: كنيات حماية لا`,
      threadID, messageID
    );
  }

  const name = args.join(" ");

  if (koniyatIntervals.has(threadID)) {
    clearTimeout(koniyatIntervals.get(threadID));
    koniyatIntervals.delete(threadID);
  }

  api.sendMessage(`— 𝖭𝗂𝖼𝗄𝗇𝖺𝗆𝖾𝗌 𝖼𝗁𝖺𝗇𝗀𝖾 𝗁𝖺𝗌 𝗌𝗍𝖺𝗋𝗍𝖾𝖽 ꗇ\n\n𝖭𝖾𝗐 𝗇𝗂𝖼𝗄𝗇𝖺𝗆𝖾: ${name}\n\n𝖥𝗈𝗋 𝗌𝗍𝗈𝗉𝗉𝗂𝗇𝗀: كنيات توقف`, threadID, messageID);

  const threadInfo = await api.getThreadInfo(threadID);
  const members = threadInfo.participantIDs;
  let index = 0;

  const changeNext = () => {
    if (!koniyatIntervals.has(threadID)) return;
    if (index >= members.length) {
      koniyatIntervals.delete(threadID);
      return api.sendMessage("✅ 𝖠𝗅𝗅 𝗇𝗂𝖼𝗄𝗇𝖺𝗆𝖾𝗌 𝗁𝖺𝗏𝖾 𝖻𝖾𝖾𝗇 𝖼𝗁𝖺𝗇𝗀𝖾𝖽 ꗇ", threadID);
    }
    api.changeNickname(name, threadID, members[index]);
    index++;
    const t = setTimeout(changeNext, 1000);
    koniyatIntervals.set(threadID, t);
  };

  const t = setTimeout(changeNext, 100);
  koniyatIntervals.set(threadID, t);
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
