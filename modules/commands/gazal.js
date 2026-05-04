module.exports.config = {
  name: "غزل",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "يتغزل بعضو عبر الرد على رسالته",
  commandCategory: "أوامر",
  usages: "غزل [رد على رسالة العضو]",
  cooldowns: 3
};

const GHAZAL = [
  "ما شاء الله عليك، عيونك تسرق العقل والقلب 💕",
  "يا إلهي، كيف يمكن أن يكون شخص جميلاً لهذه الدرجة؟ ✨",
  "لو الجمال درجات، أنت في قمتها ☁️💫",
  "ابتسامتك تضيء الكون كله 🌙",
  "أنت مثل القمر، كلما اقتربت منك زاد جمالك 🌕",
  "قلبي يخفق بشكل غريب كلما رأيت رسالتك 💓",
  "لو الذوق رجلاً كان مثلك تماماً 👑",
  "روحك قبل شكلك تسحر من حولك 🌹",
  "أنت من النوع الذي لا يُنسى مهما مرّ الزمن 🕊️",
  "لو كان الجمال جريمة لكنت أكثر الناس إجراماً 😍",
  "يا نجمة بين البشر، أنت أميرة بلا تاج 👸",
  "حتى الكلمات تعجز عن وصف روعتك 🌸",
  "وجودك في هذا القروب يضيفه شرفاً 💎",
  "الله يحفظك، مثلك نادر في هذا الزمن 🌟"
];

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID, messageReply } = event;

  const targetID = messageReply ? messageReply.senderID : senderID;
  let name = targetID;
  try {
    const info = await api.getUserInfo(targetID);
    name = info[targetID]?.name || targetID;
  } catch (e) {}

  const text = GHAZAL[Math.floor(Math.random() * GHAZAL.length)];
  return api.sendMessage(`💝 ${name}\n\n${text}`, threadID, messageID);
};
