module.exports.config = {
  name: "مدح",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "FANG",
  description: "مدح شخص عن طريق الرد على رسالته",
  commandCategory: "ترفيه",
  usages: "رد على رسالة شخص + مدح",
  cooldowns: 5
};

const praises = [
  "والله يا {name}، ما خلق الله مثلك!
ذكاؤك يفوق الوصف، وأخلاقك تفوق الكلام
أنتَ من الناس النادرين اللي يستاهلون كل خير",
  "يا {name}، لو كان المدح يوفيك حقك
لكتبت لك مجلدات ولا تكفي
إنسان بألف رجل، وصاحب في كل وقت",
  "صدقاً يا {name}، انتَ مميز من زمان
طيبتك واضحة وأخلاقك تشهد لك
ربي يحفظك ويزيدك من نعمه",
  "يا {name}، انتَ من النوع الذي يُعزّ ويُكرم
وجودك في أي مكان يضيف له روح
الله يبارك فيك ويجعل أيامك كلها عز",
  "ما أكثر الناس وما أقل أمثالك يا {name}
قيمتك عالية ومكانتك رفيعة
إنسان يستحق كل الاحترام والتقدير",
  "يا {name}، ربي خلقك ووضع فيك من الخير الكثير
من يعرفك يسعد ومن يصاحبك يغنم
دوم بألف خير يا طيب"
];

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, messageReply } = event;

  if (!messageReply)
    return api.sendMessage("❌ الرجاء الرد على رسالة الشخص الذي تريد مدحه", threadID, messageID);

  const targetID = messageReply.senderID;
  let name = targetID;
  try { const info = await api.getUserInfo(targetID); name = info[targetID]?.name || targetID; } catch(e) {}

  const praise = praises[Math.floor(Math.random() * praises.length)].replace(/{name}/g, name);
  return api.sendMessage(`🌟 ${praise}`, threadID, messageID);
};