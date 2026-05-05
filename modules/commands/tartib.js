const fs   = require("fs");
const path = require("path");
const dataDir     = path.join(__dirname, "data");
const playersPath = path.join(dataDir, "qetal_players.json");

function loadPlayers() {
  try {
    if (!fs.existsSync(playersPath)) return {};
    return JSON.parse(fs.readFileSync(playersPath, "utf8"));
  } catch { return {}; }
}

const RANK_ICON = { E:"⬜E", D:"🟩D", C:"🟦C", B:"🟪B", A:"🟧A", S:"🟥S" };
const RANK_ORDER = { E:0, D:1, C:2, B:3, A:4, S:5 };
const MEDALS = ["🥇","🥈","🥉"];

const REGION_EMOJI = {
  kohen:"🔥", jisao:"🌊", marlin:"🌪️", bastard:"🌑", shinsako:"🪨", zourd:"✨"
};

module.exports.config = {
  name: "ترتيب",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "عرض قائمة أقوى الصيادين في النظام",
  commandCategory: "نظام",
  usages: "ترتيب | ترتيب ذهب",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const allP = loadPlayers();
  const players = Object.entries(allP)
    .map(([id, p]) => ({ id, ...p }))
    .filter(p => p.level);

  if (players.length === 0)
    return api.sendMessage("📭 لا يوجد صيادون مسجلون بعد!", threadID, messageID);

  const mode = args[0] || "مستوى";

  let sorted;
  let title;

  if (mode === "ذهب") {
    sorted = players.sort((a, b) => (b.coins || 0) - (a.coins || 0));
    title = "💰 ترتيب الأثرياء";
  } else if (mode === "انتصارات") {
    sorted = players.sort((a, b) => (b.wins || 0) - (a.wins || 0));
    title = "🏆 ترتيب الانتصارات";
  } else {
    // Default: rank then level then exp
    sorted = players.sort((a, b) => {
      const rd = (RANK_ORDER[b.rank] || 0) - (RANK_ORDER[a.rank] || 0);
      if (rd !== 0) return rd;
      const ld = (b.level || 1) - (a.level || 1);
      if (ld !== 0) return ld;
      return (b.exp || 0) - (a.exp || 0);
    });
    title = "👑 ترتيب الصيادين";
  }

  const top = sorted.slice(0, 10);

  let msg = `╔══════════════════════╗\n`;
  msg += `║  ⌬ ${title}\n`;
  msg += `╚══════════════════════╝\n`;
  msg += `━━━━━━━━━━━━━━━━━\n`;

  top.forEach((p, i) => {
    const medal  = MEDALS[i] || `${i + 1}.`;
    const name   = p.playerName || p.name || "مجهول";
    const rank   = RANK_ICON[p.rank] || "⬜E";
    const region = REGION_EMOJI[p.regionId] || "🌍";

    if (mode === "ذهب") {
      msg += `${medal} ${name} ${region}\n`;
      msg += `   💰 ${(p.coins || 0).toLocaleString()} ذهب | ${rank} Lv.${p.level || 1}\n`;
    } else if (mode === "انتصارات") {
      msg += `${medal} ${name} ${region}\n`;
      msg += `   🏆 ${p.wins || 0} انتصار | 💔 ${p.losses || 0} خسارة\n`;
    } else {
      msg += `${medal} ${name} ${region}\n`;
      msg += `   ${rank} Lv.${p.level || 1} | ⭐ ${p.reputation || 0} هيبة\n`;
    }
  });

  msg += `━━━━━━━━━━━━━━━━━\n`;
  msg += `👥 إجمالي الصيادين: ${players.length}\n`;
  msg += `\nترتيب ذهب | ترتيب انتصارات | ترتيب`;

  return api.sendMessage(msg, threadID, messageID);
};
