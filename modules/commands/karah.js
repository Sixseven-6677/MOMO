const axios = require("axios");

const footballQuestions = [
  { q: "ما هي جنسية اللاعب ليونيل ميسي؟", a: ["أرجنتيني", "ارجنتيني", "الأرجنتين"] },
  { q: "في أي نادٍ يلعب كريستيانو رونالدو حالياً؟", a: ["الاتحاد", "النادي الاتحاد", "al ittihad"] },
  { q: "من هو هداف كأس العالم 2022؟", a: ["مبابي", "كيليان مبابي", "kylian mbappe"] },
  { q: "كم مرة فاز ريال مدريد بدوري أبطال أوروبا؟", a: ["15", "خمسة عشر", "15 مرة"] },
  { q: "من هو أكثر لاعب فاز بجائزة الكرة الذهبية؟", a: ["ميسي", "مسي", "lionel messi"] },
  { q: "ما هو الاسم الكامل لنادي برشلونة؟", a: ["فوتبول كلوب برشلونة", "fc barcelona", "نادي برشلونة"] },
  { q: "في أي دولة يقع ملعب السانتياغو برنابيو؟", a: ["إسبانيا", "اسبانيا", "spain"] },
  { q: "من فاز ببطولة كأس العالم 2018؟", a: ["فرنسا", "المنتخب الفرنسي", "france"] },
  { q: "ما هو لقب منتخب البرازيل؟", a: ["السيليساو", "سيليساو", "la seleção", "السيلساو"] },
  { q: "من هو حارس مرمى منتخب إسبانيا الأسطوري؟", a: ["إيكر كاسياس", "كاسياس", "casillas"] },
  { q: "في أي عام أسس نادي ريال مدريد؟", a: ["1902", "ألف وتسعمائة واثنين"] },
  { q: "من هو مدرب برشلونة الأسبق بيب جوارديولا حالياً؟", a: ["مانشستر سيتي", "سيتي", "man city"] },
  { q: "كم عدد لاعبي كرة القدم في الملعب من كلا الفريقين؟", a: ["22", "اثنين وعشرين", "22 لاعب"] },
  { q: "من سجل هدف الفوز في نهائي كأس العالم 2022؟", a: ["كيليان مبابي", "مبابي", "mbappe"] },
  { q: "ما هو رقم قميص كريستيانو رونالدو الشهير في ريال مدريد؟", a: ["7", "سبعة", "رقم 7"] },
  { q: "من هو القائد الدائم لمنتخب الأرجنتين؟", a: ["ميسي", "ليونيل ميسي", "messi"] },
  { q: "في أي عام بدأ دوري أبطال أوروبا بشكله الحالي؟", a: ["1992", "ألف وتسعمائة واثنين وتسعين"] },
  { q: "من هو هداف كرة القدم على مر العصور؟", a: ["ميسي", "كريستيانو رونالدو", "مسي"] },
  { q: "كم مدة مباراة كرة القدم العادية؟", a: ["90 دقيقة", "تسعين دقيقة", "90", "ساعة ونص"] },
  { q: "من هو حارس مرمى ليفربول الحالي الشهير؟", a: ["أليسون", "اليسون", "alisson"] },
];

const activeGames = new Map();

module.exports.config = {
  name: "كرة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "سؤال عن لاعب كرة قدم لديك 60 ثانية للإجابة",
  commandCategory: "أوامر",
  usages: "كرة",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  if (activeGames.has(threadID)) {
    return api.sendMessage("⚠️ في سؤال شغال الحين، جاوب عليه أول!", threadID, messageID);
  }

  const question = footballQuestions[Math.floor(Math.random() * footballQuestions.length)];

  await api.sendMessage(
    `⚽ 𝗙𝗈𝗈𝗍𝖻𝖺𝗅𝗅 𝗤𝘂𝗶𝘇 ꗇ\n\n❓ ${question.q}\n\n⏱ عندك 60 ثانية للإجابة!`,
    threadID, messageID
  );

  const timeout = setTimeout(async () => {
    if (!activeGames.has(threadID)) return;
    activeGames.delete(threadID);
    await api.sendMessage(
      `⌛ 𝖳𝗂𝗆𝖾 𝗂𝗌 𝗎𝗉!\n\n✅ الجواب الصحيح: ${question.a[0]}`,
      threadID
    );
  }, 60000);

  activeGames.set(threadID, { question, timeout });
};

module.exports.handleEvent = async function({ api, event }) {
  if (!event.body || !activeGames.has(event.threadID)) return;

  const { threadID, messageID } = event;
  const game = activeGames.get(threadID);
  const answer = event.body.trim().toLowerCase();

  const isCorrect = game.question.a.some(a => answer.includes(a.toLowerCase()));

  if (isCorrect) {
    clearTimeout(game.timeout);
    activeGames.delete(threadID);

    let name = "اللاعب";
    try {
      const info = await api.getUserInfo(event.senderID);
      name = info[event.senderID]?.name || name;
    } catch (e) {}

    return api.sendMessage(
      `🎉 𝖢𝗈𝗋𝗋𝖾𝖼𝗍 𝖺𝗇𝗌𝗐𝖾𝗋 ꗇ\n\n👤 ${name}\n✅ الجواب: ${game.question.a[0]}`,
      threadID, messageID
    );
  }
};
