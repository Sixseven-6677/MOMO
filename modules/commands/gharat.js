const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
const playersPath = path.join(dataDir, "qetal_players.json");

const gharatBattles = global.gharatBattles || (global.gharatBattles = new Map());
const gharatCooldowns = global.gharatCooldowns || (global.gharatCooldowns = new Map());
const RAID_COOLDOWN_MS = 3 * 60 * 1000; // 3 دقائق بين كل غارة

const battlesFilePath = path.join(dataDir, 'gharat_battles.json');

function saveBattles() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const toSave = {};
    for (const [key, b] of gharatBattles.entries()) {
      const { autoTimer, ...rest } = b;
      toSave[key] = rest;
    }
    fs.writeFileSync(battlesFilePath, JSON.stringify(toSave, null, 2));
  } catch (e) {}
}

function loadBattles() {
  try {
    if (!fs.existsSync(battlesFilePath)) return;
    const saved = JSON.parse(fs.readFileSync(battlesFilePath, 'utf8'));
    for (const [key, b] of Object.entries(saved)) {
      b.autoTimer = null;
      gharatBattles.set(key, b);
    }
  } catch (e) {}
}

if (gharatBattles.size === 0) loadBattles();

function loadPlayers() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(playersPath)) return {};
    return JSON.parse(fs.readFileSync(playersPath, "utf8"));
  } catch (e) { return {}; }
}
function savePlayers(data) {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(playersPath, JSON.stringify(data, null, 2));
  } catch (e) {}
}
function getPlayer(id, name) {
  const all = loadPlayers();
  if (!all[id]) {
    all[id] = {
      name: name || id, level: 1, exp: 0, rank: "E",
      maxHP: 120, maxStamina: 100,
      atk: 18, def: 6, coins: 0, reputation: 0,
      wins: 0, losses: 0, skillPoints: 0
    };
    savePlayers(all);
  }
  return all[id];
}
function savePlayer(id, data) {
  const all = loadPlayers();
  all[id] = data;
  savePlayers(all);
}

const RANKS = ["E", "D", "C", "B", "A", "S"];
const RANK_LEVELS = { E: [1,10], D: [11,20], C: [21,35], B: [36,50], A: [51,70], S: [71,100] };
const EXP_NEEDED = (lv) => Math.floor(100 * Math.pow(1.3, lv - 1));

const DIFFICULTIES = {
  "عادي":      { label: "عادي 🟢",      rankDelta: 0, statMult: 1.0, rewardMult: 1.0,  waves: 3 },
  "صعب":       { label: "صعب 🟡",       rankDelta: 1, statMult: 1.5, rewardMult: 2.0,  waves: 3 },
  "صعب جداً":  { label: "صعب جداً 🔴",  rankDelta: 2, statMult: 2.5, rewardMult: 3.5,  waves: 3 },
  "مستحيل":    { label: "مستحيل ☠️",    rankDelta: 3, statMult: 4.0, rewardMult: 6.0,  waves: 3 },
};

const RAID_BOSSES = {
  E: [
    { name: "قائد الغوبلن 👺",  hp: 200, atk: 20, def: 8,  exp: 80  },
    { name: "زعيم السلايم 🟢",  hp: 160, atk: 16, def: 6,  exp: 60  },
  ],
  D: [
    { name: "قائد الذئاب 🐺",   hp: 350, atk: 35, def: 15, exp: 150 },
    { name: "أورك عتيد 👹",     hp: 380, atk: 30, def: 18, exp: 140 },
  ],
  C: [
    { name: "بطل الغولم 🗿",    hp: 520, atk: 52, def: 28, exp: 280 },
    { name: "حارس الكهف ⛏",    hp: 480, atk: 48, def: 30, exp: 260 },
  ],
  B: [
    { name: "مارد الظلام 👿",   hp: 720, atk: 72, def: 42, exp: 520 },
    { name: "المحارب الأسطوري ⚔️", hp: 680, atk: 78, def: 38, exp: 500 },
  ],
  A: [
    { name: "ملك الشياطين 👑",  hp: 950, atk: 92, def: 58, exp: 820 },
    { name: "سيد الجحيم 🔥",   hp: 900, atk: 98, def: 52, exp: 840 },
  ],
  S: [
    { name: "الإله الساقط ⚫",  hp: 1300, atk: 125, def: 78, exp: 1300 },
    { name: "ملك الظلام النهائي 🌑", hp: 1500, atk: 140, def: 90, exp: 1500 },
  ],
};

// ── معادلة الرتبة الجديدة ──
// اللاعب E → بوابة D (دائماً رتبة أعلى من اللاعب)
// rankDelta من الصعوبة يُضاف فوق الرتبة الأعلى
function getRaidRank(playerRank, rankDelta) {
  const idx = RANKS.indexOf(playerRank);
  // البداية دائماً +1 فوق رتبة اللاعب، ثم نضيف صعوبة إضافية
  return RANKS[Math.min(RANKS.length - 1, idx + 1 + rankDelta)];
}

function createWaveEnemy(playerRank, rankDelta, statMult, wave) {
  const targetRank = getRaidRank(playerRank, rankDelta);
  const pool = RAID_BOSSES[targetRank] || RAID_BOSSES["D"];
  const base = pool[Math.floor(Math.random() * pool.length)];
  const waveScale = 1 + (wave - 1) * 0.35;
  return {
    name: `[موجة ${wave}] ${base.name}`,
    hp: Math.floor(base.hp * statMult * waveScale),
    maxHP: Math.floor(base.hp * statMult * waveScale),
    atk: Math.floor(base.atk * statMult * waveScale),
    def: Math.floor(base.def * statMult),
    exp: Math.floor(base.exp * waveScale),
    rank: targetRank,
    blocked: false,
    stunned: false,
  };
}

function hpBar(current, max, size = 10) {
  const filled = Math.round((current / max) * size);
  return "█".repeat(Math.max(0, filled)) + "░".repeat(Math.max(0, size - filled));
}

function raidStatus(battle) {
  const p = battle.player;
  const e = battle.enemy;
  const diff = DIFFICULTIES[battle.difficulty] || {};
  return (
    `⚡ غارة — موجة ${battle.wave}/${battle.totalWaves} — ${diff.label || battle.difficulty}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `🧍 ${p.name}\n` +
    `❤️ [${hpBar(p.hp, p.maxHP)}] ${p.hp}/${p.maxHP}\n` +
    `⚡ طاقة: ${p.stamina}/${p.maxStamina}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `👹 ${e.name} [رتبة ${e.rank}]\n` +
    `❤️ [${hpBar(e.hp, e.maxHP)}] ${e.hp}/${e.maxHP}`
  );
}

function calcDamage(atk, def, mult = 1.0) {
  const base = Math.max(1, atk - Math.floor(def * 0.5));
  const rand = 0.85 + Math.random() * 0.3;
  const crit = Math.random() < 0.12;
  let dmg = Math.floor(base * mult * rand);
  if (crit) dmg = Math.floor(dmg * 1.5);
  return { dmg, crit };
}

function processRaidAction(api, threadID, battle, battleKey, action) {
  const p = battle.player;
  const e = battle.enemy;
  let log = [];

  if (action === "هروب" || action === "فرار") {
    gharatBattles.delete(battleKey);
    if (battle.autoTimer) clearTimeout(battle.autoTimer);
    return api.sendMessage(`🏃 هربت من الغارة!\nلا مكافآت.`, threadID);
  }

  if (action === "دفاع" || action === "حماية") {
    p.blocking = true;
    p.stamina = Math.min(p.maxStamina, p.stamina + 10);
    log.push(`🛡 ${p.name} يتحصن! (+10 طاقة)`);
  } else if (action === "شفاء") {
    const heal = Math.floor(p.maxHP * 0.25);
    if (p.stamina < 30) return api.sendMessage("❌ طاقة غير كافية! (30 مطلوب)", threadID);
    p.stamina -= 30;
    p.hp = Math.min(p.maxHP, p.hp + heal);
    log.push(`💚 شفاء! +${heal} HP → ${p.hp}/${p.maxHP}`);
  } else if (action === "ضرب" || action === "هجوم" || action === "اندفاع") {
    const mult = action === "اندفاع" ? 1.8 : 1.0;
    const stCost = action === "اندفاع" ? 20 : 0;
    if (stCost > 0 && p.stamina < stCost) return api.sendMessage(`❌ طاقة غير كافية! (${stCost} مطلوب)`, threadID);
    if (stCost > 0) p.stamina -= stCost;
    const { dmg, crit } = calcDamage(p.atk, e.def, mult);
    const finalDmg = e.blocked ? Math.floor(dmg * 0.2) : dmg;
    e.blocked = false;
    e.hp = Math.max(0, e.hp - finalDmg);
    log.push(`⚔️ ${p.name} يهاجم${crit ? " (حرجي! 💥)" : ""}! ضرر: ${finalDmg}`);
  } else {
    return api.sendMessage(`❓ أوامر الغارة:\nضرب | اندفاع (×1.8) | دفاع | شفاء (-30 طاقة) | هروب`, threadID);
  }

  if (e.hp > 0 && !e.stunned) {
    const r = Math.random();
    let eMult = r < 0.7 ? 1.0 : r < 0.9 ? 1.3 : 1.8;
    if (r >= 0.9) log.push(`👹 ${e.name} يهاجم بضربة قوية! 💥`);
    else log.push(`👹 ${e.name} يهاجم! ⚔️`);
    const { dmg } = calcDamage(e.atk, p.def, eMult);
    let finalDmg = dmg;
    if (p.blocking) {
      finalDmg = Math.floor(dmg * 0.35);
      p.blocking = false;
      log.push(`🛡 الدفاع امتص الضرر! (${finalDmg} وصل)`);
    }
    p.hp = Math.max(0, p.hp - finalDmg);
    if (!p.blocking) log.push(`💔 ضرر واصل إليك: ${finalDmg}`);
  } else if (e.stunned) {
    e.stunned = false;
    log.push(`😵 ${e.name} مذهول، يفقد دوره!`);
  }

  p.stamina = Math.min(p.maxStamina, p.stamina + 12);

  if (p.hp <= 0) {
    gharatBattles.delete(battleKey);
    saveBattles();
    if (battle.autoTimer) clearTimeout(battle.autoTimer);
    // تطبيق كولداون حتى بعد الخسارة
    gharatCooldowns.set(p.id, Date.now());
    const pData = loadPlayers()[p.id] || {};
    pData.losses = (pData.losses || 0) + 1;
    pData.reputation = Math.max(0, (pData.reputation || 0) - 2);
    savePlayer(p.id, pData);
    return api.sendMessage(
      `${log.join("\n")}\n\n💀 سقطت في الغارة!\n⭐ هيبة: -2\n\n⏳ انتظر 3 دقائق قبل غارة جديدة`,
      threadID
    );
  }

  if (e.hp <= 0) {
    battle.rewards.xp += e.exp;
    battle.rewards.gold += Math.floor(e.exp * 0.6);
    battle.rewards.rep += 3;

    if (battle.wave >= battle.totalWaves) {
      gharatBattles.delete(battleKey);
      saveBattles();
      if (battle.autoTimer) clearTimeout(battle.autoTimer);
      // تطبيق كولداون بعد الغارة
      gharatCooldowns.set(p.id, Date.now());

      const diff = DIFFICULTIES[battle.difficulty] || DIFFICULTIES["عادي"];
      const totalXP   = Math.floor(battle.rewards.xp   * diff.rewardMult);
      const totalGold = Math.floor(battle.rewards.gold * diff.rewardMult);
      const totalRep  = Math.floor(battle.rewards.rep  * diff.rewardMult);

      const pData = loadPlayers()[p.id] || {};
      pData.exp        = (pData.exp || 0) + totalXP;
      pData.coins      = (pData.coins || 0) + totalGold;
      pData.reputation = Math.min(9999, (pData.reputation || 0) + totalRep);
      pData.wins       = (pData.wins || 0) + 1;

      let leveledUp = false;
      while (pData.exp >= EXP_NEEDED(pData.level || 1)) {
        pData.exp -= EXP_NEEDED(pData.level);
        pData.level = (pData.level || 1) + 1;
        pData.maxHP       = Math.floor((pData.maxHP || 120) * 1.08);
        pData.atk         = Math.floor((pData.atk || 18) * 1.06);
        pData.def         = Math.floor((pData.def || 6) * 1.06);
        pData.maxStamina  = Math.min(200, (pData.maxStamina || 100) + 5);
        for (const [rank, [min, max]] of Object.entries(RANK_LEVELS)) {
          if (pData.level >= min && pData.level <= max) { pData.rank = rank; break; }
        }
        pData.skillPoints = (pData.skillPoints || 0) + 3;
        leveledUp = true;
      }
      savePlayer(p.id, pData);

      let msg = `${log.join("\n")}\n\n`;
      msg += `🏆 غارة ناجحة! [${diff.label}]\n`;
      msg += `━━━━━━━━━━━━━━━━━\n`;
      msg += `📊 XP: +${totalXP}\n`;
      msg += `🪙 ذهب: +${totalGold}\n`;
      msg += `⭐ هيبة: +${totalRep}\n`;
      msg += `⏳ المهلة: 3 دقائق للغارة القادمة\n`;
      if (leveledUp) msg += `\n🎉 ترقية! المستوى ${pData.level} — الرتبة ${pData.rank}\n🔷 نقاط مهارة: +3`;
      return api.sendMessage(msg, threadID);
    } else {
      battle.wave++;
      battle.enemy = createWaveEnemy(p.originalRank, DIFFICULTIES[battle.difficulty].rankDelta, DIFFICULTIES[battle.difficulty].statMult, battle.wave);

      const recHP  = Math.floor(p.maxHP * 0.25);
      const recSt  = Math.floor(p.maxStamina * 0.35);
      p.hp      = Math.min(p.maxHP, p.hp + recHP);
      p.stamina = Math.min(p.maxStamina, p.stamina + recSt);

      log.push(`\n✅ موجة ${battle.wave - 1} منتهية! +${recHP} HP | +${recSt} طاقة`);
      log.push(`\n${raidStatus(battle)}`);
      log.push(`\n⏱ 30 ثانية للرد\nأوامر: ضرب | اندفاع | دفاع | شفاء | هروب`);
      api.sendMessage(log.join("\n"), threadID);

      if (battle.autoTimer) clearTimeout(battle.autoTimer);
      battle.autoTimer = setTimeout(() => {
        if (!gharatBattles.has(battleKey)) return;
        api.sendMessage(`⏰ تأخرت! هجوم تلقائي`, threadID);
        processRaidAction(api, threadID, battle, battleKey, "ضرب");
      }, 30000);
      gharatBattles.set(battleKey, battle);
      saveBattles();
      return;
    }
  }

  log.push(`\n${raidStatus(battle)}`);
  log.push(`\n⏱ 30 ثانية للرد\nأوامر: ضرب | اندفاع | دفاع | شفاء | هروب`);
  api.sendMessage(log.join("\n"), threadID);

  if (battle.autoTimer) clearTimeout(battle.autoTimer);
  battle.autoTimer = setTimeout(() => {
    if (!gharatBattles.has(battleKey)) return;
    api.sendMessage(`⏰ تأخرت! هجوم تلقائي`, threadID);
    processRaidAction(api, threadID, battle, battleKey, "ضرب");
  }, 30000);
  gharatBattles.set(battleKey, battle);
  saveBattles();
}

module.exports.config = {
  name: "غارة",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "نظام الغارات — بوابات أصعب من رتبتك دائماً، 3 موجات",
  commandCategory: "ألعاب",
  usages: "غارة | غارة عادي | غارة صعب | غارة صعب جداً | غارة مستحيل",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const battleKey = `${threadID}_${senderID}`;

  if (gharatBattles.has(battleKey)) {
    return api.sendMessage("⚔️ أنت في غارة! أنهها أولاً\nأوامر: ضرب | اندفاع | دفاع | شفاء | هروب", threadID, messageID);
  }

  // فحص المهلة بين الغارات
  const lastRaid = gharatCooldowns.get(senderID);
  if (lastRaid) {
    const elapsed = Date.now() - lastRaid;
    if (elapsed < RAID_COOLDOWN_MS) {
      const remaining = Math.ceil((RAID_COOLDOWN_MS - elapsed) / 1000);
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      return api.sendMessage(
        `⏳ انتظر قبل الغارة القادمة!\nالوقت المتبقي: ${mins}:${secs.toString().padStart(2, "0")}`,
        threadID, messageID
      );
    }
  }

  let difficulty = args.length > 0 ? args.join(" ").trim() : null;

  if (!difficulty) {
    const roll = Math.random();
    if (roll < 0.50)      difficulty = "عادي";
    else if (roll < 0.80) difficulty = "صعب";
    else if (roll < 0.95) difficulty = "صعب جداً";
    else                  difficulty = "مستحيل";
  }

  if (!DIFFICULTIES[difficulty]) {
    return api.sendMessage(
      `❌ صعوبة غير معروفة!\n\nالصعوبات المتاحة:\n🟢 غارة عادي\n🟡 غارة صعب\n🔴 غارة صعب جداً\n☠️ غارة مستحيل\n\nأو اكتب: غارة (صعوبة عشوائية)`,
      threadID, messageID
    );
  }

  let senderName = senderID;
  try { const info = await api.getUserInfo(senderID); senderName = info[senderID]?.name || senderID; } catch (e) {}

  const pData = getPlayer(senderID, senderName);
  const diff  = DIFFICULTIES[difficulty];
  const firstEnemy = createWaveEnemy(pData.rank, diff.rankDelta, diff.statMult, 1);

  const player = {
    id:           senderID,
    name:         senderName,
    originalRank: pData.rank,
    hp:           pData.maxHP,
    maxHP:        pData.maxHP,
    stamina:      pData.maxStamina,
    maxStamina:   pData.maxStamina,
    atk:          pData.atk,
    def:          pData.def,
    blocking:     false,
  };

  const battle = {
    type:        "raid",
    difficulty,
    wave:        1,
    totalWaves:  diff.waves,
    player,
    enemy:       firstEnemy,
    rewards:     { xp: 0, gold: 0, rep: 0 },
    threadID,
    turnStartTime: Date.now(),
    autoTimer:   null,
  };

  gharatBattles.set(battleKey, battle);
  saveBattles();

  const startMsg =
    `⚡ غارة تبدأ!\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `🎯 الصعوبة: ${diff.label}\n` +
    `💰 مكافأة: ×${diff.rewardMult}\n` +
    `🌊 الموجات: ${diff.waves}\n` +
    `⚠️ الأعداء أقوى من رتبتك!\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `${raidStatus(battle)}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `⏱ 30 ثانية للرد!\nأوامر: ضرب | اندفاع (×1.8) | دفاع | شفاء | هروب`;

  api.sendMessage(startMsg, threadID, messageID);

  battle.autoTimer = setTimeout(() => {
    if (!gharatBattles.has(battleKey)) return;
    api.sendMessage(`⏰ تأخرت! هجوم تلقائي`, threadID);
    processRaidAction(api, threadID, battle, battleKey, "ضرب");
  }, 30000);
};

module.exports.handleEvent = async function({ api, event }) {
  if (!event.body) return;
  const body = event.body.trim();
  const { threadID, senderID } = event;

  const battleKey = `${threadID}_${senderID}`;
  if (!gharatBattles.has(battleKey)) return;

  const battle = gharatBattles.get(battleKey);
  if (battle.autoTimer) clearTimeout(battle.autoTimer);
  battle.turnStartTime = Date.now();

  const action = body.split(/\s+/)[0];
  processRaidAction(api, threadID, battle, battleKey, action);
};
