const manAnaGames = global.manAnaGames || (global.manAnaGames = new Map());

const characters = [
  { name:"صلاح الدين الأيوبي", clues:["محارب ومحرر مشهور","حرر مدينة القدس","عاش في القرن الثاني عشر الميلادي"] },
  { name:"ابن سينا", clues:["طبيب وفيلسوف مسلم","ألّف كتاب القانون في الطب","لقّبوه بأمير الأطباء"] },
  { name:"ابن بطوطة", clues:["رحّالة مغربي شهير","سافر أكثر من 100 ألف كيلومتر","زار الهند والصين وأفريقيا"] },
  { name:"خالد بن الوليد", clues:["لقّب بسيف الله المسلول","قائد عسكري لم يُهزم","من أبطال معركة اليرموك"] },
  { name:"الرازي", clues:["طبيب وكيميائي مسلم","اكتشف الكحول الإيثيلي","كتب الحاوي في الطب"] },
  { name:"ابن خلدون", clues:["مؤرخ واجتماعي تونسي","أسس علم الاجتماع","كتب المقدمة الشهيرة"] },
  { name:"الخوارزمي", clues:["رياضي وفلكي مسلم","أوجد علم الجبر","اسمه أصل كلمة algorithm"] },
  { name:"رابعة العدوية", clues:["صوفية مسلمة مشهورة","وُلدت في البصرة","عُرفت بالزهد والعبادة"] },
  { name:"طارق بن زياد", clues:["قائد فاتح الأندلس","أحرق السفن ليمنع التراجع","نسب إليه جبل طارق"] },
  { name:"الجاحظ", clues:["أديب وعالم عربي","من أبرز علماء المعتزلة","ألّف كتاب الحيوان والبخلاء"] },
];

module.exports.config = {
  name: "من أنا",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "لعبة تخمين الشخصية التاريخية",
  commandCategory: "الترفيه",
  usages: "من أنا — لبدء اللعبة | من أنا [الإجابة] — للتخمين",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // إجابة
  if (args[0] && manAnaGames.has(threadID)) {
    const game = manAnaGames.get(threadID);
    const guess = args.join(" ").trim();

    if (guess.includes(game.answer.split(" ")[0]) || guess.includes(game.answer.split(" ")[1] || game.answer)) {
      manAnaGames.delete(threadID);
      let name = senderID;
      try { const i = await api.getUserInfo(senderID); name = i[senderID]?.name || senderID; } catch(e) {}
      return api.sendMessage(
        `🎉 إجابة صحيحة!\n👑 ${name} عرف الشخصية!\n\n✅ الجواب: ${game.answer}`,
        threadID, messageID
      );
    }

    // كشف تلميح إضافي
    if (game.clueIndex < game.clues.length) {
      const clue = game.clues[game.clueIndex++];
      return api.sendMessage(
        `❌ خطأ!\n\n💡 تلميح ${game.clueIndex}:\n${clue}\n\nحاول مجدداً — من أنا [الإجابة]`,
        threadID, messageID
      );
    }

    manAnaGames.delete(threadID);
    return api.sendMessage(
      `😔 انتهت التلميحات!\n\n✅ الجواب كان: ${game.answer}\n\nاكتب "من أنا" لجولة جديدة`,
      threadID, messageID
    );
  }

  // لعبة جديدة
  if (manAnaGames.has(threadID)) {
    const g = manAnaGames.get(threadID);
    return api.sendMessage(
      `⚠️ اللعبة جارية!\n\n💡 التلميحات حتى الآن:\n${g.clues.slice(0, g.clueIndex).map((c,i)=>`${i+1}. ${c}`).join("\n")}\n\nمن أنا [الإجابة]`,
      threadID, messageID
    );
  }

  const char = characters[Math.floor(Math.random() * characters.length)];
  manAnaGames.set(threadID, {
    answer: char.name,
    clues: char.clues,
    clueIndex: 1
  });

  return api.sendMessage(
    `🎭 لعبة: من أنا؟\n━━━━━━━━━━━━━━\n\n💡 تلميح 1:\n${char.clues[0]}\n\nاكتب: من أنا [الإجابة]\nأو اكتب: من أنا لتلميح ثانٍ`,
    threadID, messageID
  );
};
