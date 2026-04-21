const games = new Map();

const daresAr = [
  "قول شيء محرج عنك",
  "قول أحلى شيء في هذا الكروب",
  "اعترف بشيء ما تبيه أحد يعرفه",
  "قول اسم أحد تحب تعرفه أكثر",
  "قول شيء ما قلته لأحد من قبل",
  "وصف نفسك بكلمة واحدة",
  "قول آخر شيء بحثت عنه",
  "قول أشخاص توقعت ما راح يكونون بهالكروب",
];

const truthsAr = [
  "ما هو أكثر شيء تندم عليه؟",
  "هل سبق أن كذبت على شخص في هذا الكروب؟",
  "ما هو سرك الذي لا يعرفه أحد؟",
  "هل تحب أحد الآن؟",
  "ما هي أكبر خسارة مررت بها؟",
  "من هو الشخص الذي تثق فيه أكثر من الجميع؟",
  "هل سبق أن حسدت أحد في هذا الكروب؟",
  "ما هو الشيء الذي تخشى أن يعرفه الناس عنك؟",
  "ما هو أحلى ذكرى عندك؟",
  "هل سبق أن خذلت أحد تحبه؟",
];

module.exports.config = {
  name: "صراحة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "لعبة صراحة وجرأة",
  commandCategory: "أوامر",
  usages: "صراحة | صراحة [صراحة/جرأة]",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  let name = "اللاعب";
  try {
    const info = await api.getUserInfo(senderID);
    name = info[senderID]?.name || name;
  } catch (e) {}

  if (!args[0] || args[0] === "اختيار") {
    return api.sendMessage(
      `🎮 𝗧𝗿𝘂𝗍𝗵 𝗼𝗿 𝗗𝗮𝗿𝖾 ꗇ\n\n` +
      `👤 ${name}\n\n` +
      `اختر:\n- صراحة صراحة\n- صراحة جرأة`,
      threadID, messageID
    );
  }

  if (args[0] === "صراحة") {
    const q = truthsAr[Math.floor(Math.random() * truthsAr.length)];
    return api.sendMessage(
      `🔮 𝗧𝗿𝘂𝗍𝗵 ꗇ\n\n👤 ${name}\n❓ ${q}`,
      threadID, messageID
    );
  }

  if (args[0] === "جرأة") {
    const d = daresAr[Math.floor(Math.random() * daresAr.length)];
    return api.sendMessage(
      `🔥 𝗗𝖺𝗋𝖾 ꗇ\n\n👤 ${name}\n🎯 ${d}`,
      threadID, messageID
    );
  }

  return api.sendMessage(
    `⚠️ اكتب:\n- صراحة صراحة\n- صراحة جرأة`,
    threadID, messageID
  );
};
