module.exports.config = {
  name: "مدح",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "يمدح عضواً عبر الرد على رسالته",
  commandCategory: "أوامر",
  usages: "مدح [رد على رسالة العضو]",
  cooldowns: 3
};

const MADH = [
  "ما شاء الله عليك، إنسان راقٍ بكل المقاييس 🌟",
  "أنت من النوع النادر الذي يصعب إيجاده في هذا الزمن 💎",
  "شخصيتك قوية ومحترمة، والكل يشهد لك بذلك 👏",
  "ذكاؤك واضح من أول كلمة تقولها 🧠✨",
  "أنت مثال يُحتذى به في كل شيء بدون استثناء 🏆",
  "الله يحفظك، إنسان من ذهب خالص 🥇",
  "عقلك كبير وقلبك أكبر منه 💪",
  "ما شاء الله، موهبة نادرة وإنسان أصيل من الطراز الأول 🌹",
  "تقدر تفخر بنفسك، أنت مميز بكل معنى الكلمة ⭐",
  "الله يزيدك ويبارك فيك، إنسان ما إليه آخر 🤲",
  "كل اللي يعرفك محظوظون برفقتك 🌿",
  "كلامك دايماً في محله، وعقلك ما يخذل أبداً 💡",
  "أنت فخر المجموعة وزينها، ما شاء الله 👑",
  "ربي يحفظك ويعزك، أنت تستاهل كل خير 🌸"
];

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID, messageReply } = event;

  const targetID = messageReply ? messageReply.senderID : senderID;
  let name = targetID;
  try {
    const info = await api.getUserInfo(targetID);
    name = info[targetID]?.name || targetID;
  } catch (e) {}

  const text = MADH[Math.floor(Math.random() * MADH.length)];
  return api.sendMessage(`🌟 ${name}\n\n${text}`, threadID, messageID);
};
