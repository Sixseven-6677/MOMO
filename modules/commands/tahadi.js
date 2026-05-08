const tahadi = global.tahadi || (global.tahadi = new Map());
// Map<threadID, {player1, player2, name1, name2, hp1, hp2, turn, active}>

const moves = [
  { name: "⚔️ ضربة قوية",   dmg: [20, 35], miss: 0.1  },
  { name: "🏹 سهم دقيق",    dmg: [15, 25], miss: 0.05 },
  { name: "🔥 هجوم ناري",   dmg: [25, 40], miss: 0.2  },
  { name: "💨 ضربة خاطفة",  dmg: [10, 20], miss: 0.15 },
  { name: "🌊 موجة مائية",  dmg: [18, 30], miss: 0.1  },
  { name: "⚡ صاعقة",       dmg: [30, 45], miss: 0.25 },
];

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function hp_bar(hp) {
  const filled = Math.round(hp / 10);
  return "█".repeat(Math.max(0, filled)) + "░".repeat(Math.max(0, 10 - filled)) + ` ${hp}/100`;
}

module.exports.config = {
  name: "تحدي",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "تحدي قتالي بين عضوين — رد على رسالة شخص وقل تحدي",
  commandCategory: "الترفيه",
  usages: "تحدي (رد على رسالة) | تحدي هجوم | تحدي إنهاء",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply } = event;
  const sub = args[0];

  // إنهاء التحدي
  if (sub === "إنهاء") {
    if (tahadi.has(threadID)) {
      tahadi.delete(threadID);
      return api.sendMessage("✅ تم إنهاء التحدي", threadID, messageID);
    }
    return api.sendMessage("⚠️ لا يوجد تحدٍ جارٍ", threadID, messageID);
  }

  // هجوم
  if (sub === "هجوم") {
    const battle = tahadi.get(threadID);
    if (!battle || !battle.active) return api.sendMessage("⚠️ لا يوجد تحدٍ جارٍ — ابدأ بالرد على رسالة شخص وقل تحدي", threadID, messageID);

    const isP1 = String(senderID) === String(battle.player1);
    const isP2 = String(senderID) === String(battle.player2);
    if (!isP1 && !isP2) return api.sendMessage("❌ أنت لست في هذا التحدي", threadID, messageID);
    if ((battle.turn === 1 && !isP1) || (battle.turn === 2 && !isP2))
      return api.sendMessage("⏳ انتظر دورك!", threadID, messageID);

    const move = moves[rnd(0, moves.length - 1)];
    const missed = Math.random() < move.miss;
    let dmg = missed ? 0 : rnd(move.dmg[0], move.dmg[1]);

    const attacker = battle.turn === 1 ? battle.name1 : battle.name2;
    const defender = battle.turn === 1 ? battle.name2 : battle.name1;

    if (battle.turn === 1) battle.hp2 = Math.max(0, battle.hp2 - dmg);
    else battle.hp1 = Math.max(0, battle.hp1 - dmg);

    battle.turn = battle.turn === 1 ? 2 : 1;

    // هل انتهت المعركة؟
    if (battle.hp1 <= 0 || battle.hp2 <= 0) {
      const winner = battle.hp1 > 0 ? battle.name1 : battle.name2;
      tahadi.delete(threadID);
      return api.sendMessage(
        `${move.name}\n${missed ? `💨 ${attacker} أخطأ الهجوم!` : `💥 ${attacker} ضرب ${defender} بـ ${dmg} ضرر!`}\n\n` +
        `🏆 انتهى التحدي!\n👑 الفائز: ${winner}`,
        threadID, messageID
      );
    }

    const nextTurn = battle.turn === 1 ? battle.name1 : battle.name2;
    return api.sendMessage(
      `${move.name}\n${missed ? `💨 ${attacker} أخطأ الهجوم!` : `💥 ${attacker} ضرب ${defender} بـ ${dmg} ضرر!`}\n\n` +
      `❤️ ${battle.name1}: ${hp_bar(battle.hp1)}\n` +
      `❤️ ${battle.name2}: ${hp_bar(battle.hp2)}\n\n` +
      `⚔️ دور: ${nextTurn}\nاكتب: تحدي هجوم`,
      threadID, messageID
    );
  }

  // بدء تحدي جديد
  if (tahadi.has(threadID))
    return api.sendMessage("⚠️ يوجد تحدٍ جارٍ بالفعل — اكتب: تحدي إنهاء لإلغائه", threadID, messageID);

  if (!messageReply || !messageReply.senderID)
    return api.sendMessage("❌ رد على رسالة الشخص الذي تريد تحديه وقل: تحدي", threadID, messageID);

  const player2 = messageReply.senderID;
  if (String(player2) === String(senderID))
    return api.sendMessage("❌ لا تقدر تتحدى نفسك!", threadID, messageID);

  let name1 = "اللاعب 1", name2 = "اللاعب 2";
  try {
    const info = await api.getUserInfo([senderID, player2]);
    name1 = info[senderID]?.name || name1;
    name2 = info[player2]?.name || name2;
  } catch(e) {}

  tahadi.set(threadID, { player1: senderID, player2, name1, name2, hp1: 100, hp2: 100, turn: 1, active: true });

  return api.sendMessage(
    `⚔️ تحدٍ جديد!\n\n👤 ${name1}  VS  👤 ${name2}\n\n` +
    `❤️ ${name1}: ${hp_bar(100)}\n❤️ ${name2}: ${hp_bar(100)}\n\n` +
    `🎯 يبدأ: ${name1}\nاكتب: تحدي هجوم`,
    threadID, messageID
  );
};
