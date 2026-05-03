module.exports.config = {
  name: "توبيخ",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "يوبخ عضواً عبر الرد على رسالته",
  commandCategory: "أوامر",
  usages: "توبيخ [رد على رسالة العضو]",
  cooldowns: 3
};

const TAWBEEKH = [
  "يا أخي، شيل عقلك معك شوية! 😤",
  "هذا الكلام ما يليق وما نتوقعه منك أبداً 🚫",
  "اتقِ الله وانظر ماذا تفعل! 👆",
  "الواحد يتوقع منك أحسن من هذا بكثير 😒",
  "هذا تصرف غير لائق وأنت تعرف ذلك جيداً 🤦",
  "وقّف عند حدك، الكلام هذا ما يمشي هنا ✋",
  "أين ذهب عقلك؟ فكّر قبل ما تتكلم 🧠",
  "استحِ من نفسك على الأقل! 😡",
  "هذا ما يليق بشخص مثلك، راجع تصرفاتك 🫵",
  "الله يهديك، تصرفاتك هذه ما تنفع 🤲",
  "أنا توقعت منك أحسن من هذا الموقف 😔",
  "كل واحد يتحمل مسؤولية كلامه، فكّر مليح ✋",
  "هذا سلوك ما يُقبل هنا ولا في أي مكان 🚷",
  "ادري إنك تعرف الصح، فلماذا تفعل العكس؟ 🙄"
];

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID, messageReply } = event;

  const targetID = messageReply ? messageReply.senderID : senderID;
  let name = targetID;
  try {
    const info = await api.getUserInfo(targetID);
    name = info[targetID]?.name || targetID;
  } catch (e) {}

  const text = TAWBEEKH[Math.floor(Math.random() * TAWBEEKH.length)];
  return api.sendMessage(`⚠️ ${name}\n\n${text}`, threadID, messageID);
};
