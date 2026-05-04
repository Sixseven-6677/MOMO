const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
const playersPath = path.join(dataDir, "qetal_players.json");

const activeBattles = global.qetalBattles || (global.qetalBattles = new Map());
const pvpChallenges = global.qetalChallenges || (global.qetalChallenges = new Map());

// ═══════════════════════════════════════
//            بيانات اللاعبين
// ═══════════════════════════════════════
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
      atk: 18, def: 6, spd: 10,
      wins: 0, losses: 0, kills: 0,
      style: { attack: 0, defend: 0, skill: 0, flee: 0 },
      skillCooldowns: {}
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

// ═══════════════════════════════════════
//                المهارات
// ═══════════════════════════════════════
const SKILLS = {
  اندفاع:   { name: "اندفاع ⚡",  dmg: 1.8, heal: 0,  staminaCost: 20, cd: 2, effect: null,      desc: "ضربة سريعة ×1.8" },
  درع:      { name: "درع 🛡",    dmg: 0,   heal: 0,  staminaCost: 25, cd: 3, effect: "block",    desc: "يمتص 80% من الضربة القادمة" },
  شفاء:     { name: "شفاء 💚",   dmg: 0,   heal: 40, staminaCost: 30, cd: 4, effect: "heal",     desc: "يستعيد 40 نقطة HP" },
  غضب:      { name: "غضب 🔥",    dmg: 2.5, heal: 0,  staminaCost: 40, cd: 5, effect: "stun",     desc: "ضربة مدمرة ×2.5 + ذهول للعدو" },
  تحليل:    { name: "تحليل 🔍",  dmg: 0,   heal: 0,  staminaCost: 15, cd: 3, effect: "analyze",  desc: "يكشف نقطة ضعف الخصم" },
  // ── تعاويذ المتجر ──
  نار:      { name: "نار 🔥",    dmg: 2.0, heal: 0,  staminaCost: 35, cd: 3, effect: "burn",     desc: "55 ضرر + حرق 8/جولة", requireSpell: "نار" },
  صاعقة:   { name: "صاعقة ⚡",  dmg: 2.3, heal: 0,  staminaCost: 40, cd: 4, effect: "stun",     desc: "65 ضرر + ذهول", requireSpell: "صاعقة" },
  جليد:    { name: "جليد 🧊",   dmg: 1.7, heal: 0,  staminaCost: 30, cd: 3, effect: "slow",     desc: "45 ضرر + إبطاء -20%", requireSpell: "جليد" },
  فراغ:    { name: "فراغ 🌑",   dmg: 3.5, heal: 0,  staminaCost: 60, cd: 6, effect: "void",     desc: "100 ضرر يتجاهل الدفاع", requireSpell: "فراغ" },
  // ── مهارات شجرة التطوير ──
  تسميم:   { name: "تسميم 🐍",  dmg: 0,   heal: 0,  staminaCost: 20, cd: 3, effect: "poison",   desc: "10 ضرر/جولة لـ 4 جولات", requirePerk: "poison_skill" },
  اختفاء:  { name: "اختفاء 🌑", dmg: 1.0, heal: 0,  staminaCost: 30, cd: 4, effect: "vanish",   desc: "هروب مضمون + هجوم مضاد 30", requirePerk: "vanish_skill" },
  توقع:    { name: "توقع 🎯",   dmg: 0,   heal: 0,  staminaCost: 20, cd: 4, effect: "predict",  desc: "تتفادى الضربة القادمة تماماً", requirePerk: "predict_skill" },
  تخطيط:   { name: "تخطيط 🎯", dmg: 0,   heal: 0,  staminaCost: 25, cd: 5, effect: "plan",     desc: "×2 ضرر للجولتين القادمتين", requirePerk: "plan_skill" },
};

// ── مكافآت الأسلحة والدروع ──
const WEAPON_BONUSES = {
  iron_sword:     { atk: 5 },
  steel_blade:    { atk: 12 },
  shadow_edge:    { atk: 20, crit: 0.10 },
  dark_blade:     { atk: 30, armorPen: 0.20 },
  monarchs_blade: { atk: 50, crit: 0.20 },
  void_reaper:    { atk: 80, crit: 0.30, armorPen: 0.30 },
};
const ARMOR_BONUSES = {
  leather_armor:  { def: 5 },
  iron_armor:     { def: 12 },
  shadow_cloak:   { def: 18, dodge: 0.10 },
  dragon_scale:   { def: 30, hp: 50 },
  monarchs_guard: { def: 50, hp: 100, dodge: 0.15 },
  void_mantle:    { def: 80, hp: 200, dodge: 0.25 },
};

// ═══════════════════════════════════════
//              الوحوش (Solo Leveling)
// ═══════════════════════════════════════
const MONSTERS = {
  E: [
    { name: "غوبلن 👺",   hp: 80,  atk: 12, def: 3,  exp: 30,  weakTo: "اندفاع", style: "aggressive" },
    { name: "سلايم 🟢",   hp: 60,  atk: 8,  def: 5,  exp: 20,  weakTo: "غضب",    style: "passive" },
  ],
  D: [
    { name: "ذئب 🐺",     hp: 130, atk: 20, def: 8,  exp: 60,  weakTo: "درع",    style: "aggressive" },
    { name: "أورك 👹",    hp: 160, atk: 18, def: 12, exp: 70,  weakTo: "تحليل",  style: "defensive" },
  ],
  C: [
    { name: "غولم 🗿",    hp: 220, atk: 28, def: 20, exp: 120, weakTo: "غضب",    style: "defensive" },
    { name: "فارس الظل 🖤", hp: 200, atk: 32, def: 15, exp: 130, weakTo: "شفاء",   style: "counter" },
  ],
  B: [
    { name: "الوحش الصامت 😶", hp: 300, atk: 40, def: 25, exp: 220, weakTo: "تحليل", style: "adaptive" },
    { name: "تنين صغير 🐉",    hp: 280, atk: 45, def: 18, exp: 240, weakTo: "اندفاع", style: "aggressive" },
  ],
  A: [
    { name: "شيطان الجليد 🧊",  hp: 400, atk: 55, def: 35, exp: 400, weakTo: "غضب",    style: "adaptive" },
    { name: "أمير الظلام 👑",   hp: 450, atk: 60, def: 30, exp: 450, weakTo: "درع",    style: "counter" },
  ],
  S: [
    { name: "ظل الملك 🌑",     hp: 600, atk: 80, def: 50, exp: 700, weakTo: "تحليل", style: "adaptive" },
    { name: "أنتاريس 🔴",      hp: 700, atk: 90, def: 55, exp: 800, weakTo: "شفاء",   style: "berserker" },
  ],
};

const RANK_LEVELS = { E: [1,10], D: [11,20], C: [21,35], B: [36,50], A: [51,70], S: [71,100] };
const EXP_NEEDED = (lv) => Math.floor(100 * Math.pow(1.3, lv - 1));

function getMonsterForPlayer(p) {
  const rank = p.rank;
  const pool = MONSTERS[rank] || MONSTERS["E"];
  const m = pool[Math.floor(Math.random() * pool.length)];
  const scale = 1 + (p.level * 0.05);
  return {
    ...m,
    hp: Math.floor(m.hp * scale), maxHP: Math.floor(m.hp * scale),
    stamina: 100, maxStamina: 100,
    atk: Math.floor(m.atk * scale),
    def: Math.floor(m.def * scale),
    blocked: false, stunned: false, analyzed: false,
    aiMemory: { attackCount: 0, defendCount: 0, skillCount: 0 }
  };
}

// ═══════════════════════════════════════
//             حساب الضرر
// ═══════════════════════════════════════
function calcDamage(atk, def, mult = 1.0, crit = false) {
  const base = Math.max(1, atk - Math.floor(def * 0.5));
  const rand = 0.85 + Math.random() * 0.3;
  let dmg = Math.floor(base * mult * rand);
  if (crit) dmg = Math.floor(dmg * 1.5);
  return { dmg, crit };
}

function speedBonus(elapsed) {
  if (elapsed < 5000) return 1.15;
  if (elapsed < 15000) return 1.0;
  if (elapsed < 25000) return 0.85;
  return 0.7;
}

// ═══════════════════════════════════════
//           لوحة الحالة (HP Bar)
// ═══════════════════════════════════════
function hpBar(current, max, size = 10) {
  const filled = Math.round((current / max) * size);
  return "█".repeat(Math.max(0, filled)) + "░".repeat(Math.max(0, size - filled));
}

function battleStatus(battle) {
  const p = battle.player;
  const e = battle.enemy;
  const pBar = hpBar(p.hp, p.maxHP);
  const eBar = hpBar(e.hp, e.maxHP);
  return (
    `⚔️ معركة — الجولة ${battle.turn}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `🧍 ${p.name}\n` +
    `❤️ [${pBar}] ${p.hp}/${p.maxHP}\n` +
    `⚡ طاقة: ${p.stamina}/${p.maxStamina}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `👹 ${e.name}\n` +
    `❤️ [${eBar}] ${e.hp}/${e.maxHP}\n` +
    (e.analyzed ? `🔍 الضعف: ${e.weakTo}\n` : ``)
  );
}

function skillsMenu(player) {
  const cd = player.skillCooldowns || {};
  const lines = Object.entries(SKILLS).map(([key, sk]) => {
    const cdLeft = (cd[key] || 0);
    const cdStr = cdLeft > 0 ? ` (CD: ${cdLeft} جولات)` : " ✅";
    return `• ${key}: ${sk.desc} | طاقة: ${sk.staminaCost}${cdStr}`;
  });
  return lines.join("\n");
}

// ═══════════════════════════════════════
//             ذكاء الوحش
// ═══════════════════════════════════════
function monsterAI(monster, player, playerLastAction) {
  const mem = monster.aiMemory;

  if (monster.stunned) {
    monster.stunned = false;
    return { action: "skip", msg: `${monster.name} مذهول، يفقد دوره!` };
  }

  // Adaptive AI
  if (monster.style === "adaptive" || monster.style === "counter") {
    if (mem.attackCount > mem.defendCount + 2 && Math.random() > 0.4) {
      monster.blocked = true;
      return { action: "block", msg: `${monster.name} يتوقع هجومك ويحتمي! 🛡` };
    }
    if (mem.skillCount > 2 && Math.random() > 0.5) {
      return { action: "power", msg: `${monster.name} يكسر دفاعك بضربة ثقيلة! 💥`, mult: 2.0 };
    }
  }

  if (monster.style === "berserker") {
    return { action: "attack", msg: `${monster.name} يهاجم بجنون! 🔴`, mult: 1.5 };
  }

  if (monster.style === "defensive" && player.hp > player.maxHP * 0.6) {
    if (Math.random() > 0.5) {
      monster.blocked = true;
      return { action: "block", msg: `${monster.name} يتخذ موقف دفاعي! 🛡` };
    }
  }

  if (monster.style === "passive" && monster.hp < monster.maxHP * 0.4) {
    return { action: "attack", msg: `${monster.name} يقاوم بشراسة! 😤`, mult: 1.8 };
  }

  // Default
  const r = Math.random();
  if (r < 0.65) return { action: "attack", msg: `${monster.name} يهاجم! ⚔️`, mult: 1.0 };
  if (r < 0.85) { monster.blocked = true; return { action: "block", msg: `${monster.name} يتحصن! 🛡` }; }
  return { action: "attack", msg: `${monster.name} يضرب بقوة! 💥`, mult: 1.3 };
}

// ═══════════════════════════════════════
//           خلوص المعركة
// ═══════════════════════════════════════
function checkRankUp(p) {
  for (const [rank, [min, max]] of Object.entries(RANK_LEVELS)) {
    if (p.level >= min && p.level <= max) { p.rank = rank; break; }
  }
}

function endBattle(api, threadID, battleKey, winner, battle) {
  const t = activeBattles.get(battleKey);
  if (t && t.autoTimer) clearTimeout(t.autoTimer);
  activeBattles.delete(battleKey);

  const isPlayer = winner === "player";
  const p = battle.player;
  const pData = loadPlayers()[p.id] || {};

  if (isPlayer) {
    pData.wins = (pData.wins || 0) + 1;
    pData.kills = (pData.kills || 0) + 1;
    pData.exp = (pData.exp || 0) + battle.enemy.exp;
    let leveledUp = false;
    while (pData.exp >= EXP_NEEDED(pData.level || 1)) {
      pData.exp -= EXP_NEEDED(pData.level);
      pData.level = (pData.level || 1) + 1;
      pData.maxHP = Math.floor((pData.maxHP || 120) * 1.08);
      pData.atk = Math.floor((pData.atk || 18) * 1.06);
      pData.def = Math.floor((pData.def || 6) * 1.06);
      pData.maxStamina = Math.min(200, (pData.maxStamina || 100) + 5);
      checkRankUp(pData);
      leveledUp = true;
    }
    // Reduce skill cooldowns
    const cd = pData.skillCooldowns || {};
    for (const k of Object.keys(cd)) { if (cd[k] > 0) cd[k]--; }
    pData.skillCooldowns = cd;

    // ── ذهب وهيبة ──
    const xpBoost = pData.boosts?.xp?.battles > 0 ? (pData.boosts.xp.mult || 2) : 1;
    const goldBoost = pData.boosts?.gold?.battles > 0 ? (pData.boosts.gold.mult || 2) : 1;
    const coinsEarned = Math.floor(battle.enemy.exp * 0.6 * goldBoost);
    pData.coins = (pData.coins || 0) + coinsEarned;
    pData.reputation = Math.min(9999, (pData.reputation || 0) + 5);
    if (leveledUp) pData.skillPoints = (pData.skillPoints || 0) + 3;
    if (pData.boosts?.xp)   { pData.boosts.xp.battles   = Math.max(0, (pData.boosts.xp.battles   || 0) - 1); }
    if (pData.boosts?.gold) { pData.boosts.gold.battles  = Math.max(0, (pData.boosts.gold.battles  || 0) - 1); }

    // ── نقاط حرب الممالك ──
    if (pData.guild) {
      try {
        const guildsPath2 = path.join(dataDir, "qetal_guilds.json");
        if (fs.existsSync(guildsPath2)) {
          const guilds = JSON.parse(fs.readFileSync(guildsPath2, "utf8"));
          const g = guilds[pData.guild];
          if (g && g.warWith && g.warScore) {
            g.warScore.us = (g.warScore.us || 0) + 1;
            g.reputation  = (g.reputation  || 0) + 2;
            const enemyG  = guilds[g.warWith];
            if (enemyG && enemyG.warScore) enemyG.warScore.them = (enemyG.warScore.them || 0) + 1;
            if (g.warScore.us >= 10) {
              api.sendMessage(`🏆 مملكة ${pData.guild} فازت في الحرب ضد ${g.warWith}!`, threadID);
              g.reputation = (g.reputation || 0) + 50;
              g.warWith = null; g.warScore = null;
              if (enemyG) { enemyG.warWith = null; enemyG.warScore = null; }
            }
            fs.writeFileSync(guildsPath2, JSON.stringify(guilds, null, 2));
          }
        }
      } catch (_) {}
    }

    savePlayer(p.id, pData);

    let msg = `🏆 انتصار!\n\n${p.name} انتصر على ${battle.enemy.name}!\n`;
    msg += `📊 XP: +${Math.floor(battle.enemy.exp * xpBoost)}${xpBoost > 1 ? ` (×${xpBoost} بوست!)` : ""}\n`;
    msg += `🪙 ذهب: +${coinsEarned}${goldBoost > 1 ? ` (×${goldBoost} بوست!)` : ""} | ⭐ هيبة: +5\n`;
    if (leveledUp) msg += `\n🎉 ترقية! المستوى ${pData.level} — الرتبة ${pData.rank}\n🔷 نقاط مهارة جديدة: +3 | اكتب: شجرة`;
    return api.sendMessage(msg, threadID);
  } else {
    pData.losses = (pData.losses || 0) + 1;
    pData.skillCooldowns = pData.skillCooldowns || {};
    pData.reputation = Math.max(0, (pData.reputation || 0) - 3);
    savePlayer(p.id, pData);
    return api.sendMessage(
      `💀 هزيمة!\n\n${p.name} سقط أمام ${battle.enemy.name}!\n⭐ هيبة: -3\nتدرب أكثر وحاول مجدداً...\n\n🔁 قتال مجدداً: اكتب قتال`,
      threadID
    );
  }
}

function endPvP(api, threadID, battleKey, winnerId, battle) {
  const t = activeBattles.get(battleKey);
  if (t && t.autoTimer) clearTimeout(t.autoTimer);
  activeBattles.delete(battleKey);

  const winner = winnerId === battle.player.id ? battle.player : battle.enemy;
  const loser  = winnerId === battle.player.id ? battle.enemy : battle.player;

  const allP = loadPlayers();
  if (allP[winnerId]) {
    allP[winnerId].wins = (allP[winnerId].wins || 0) + 1;
    allP[winnerId].coins = (allP[winnerId].coins || 0) + 80;
    allP[winnerId].reputation = Math.min(9999, (allP[winnerId].reputation || 0) + 10);
  }
  if (allP[loser.id]) {
    allP[loser.id].losses = (allP[loser.id].losses || 0) + 1;
    allP[loser.id].reputation = Math.max(0, (allP[loser.id].reputation || 0) - 5);
  }
  savePlayers(allP);

  return api.sendMessage(
    `⚔️ انتهت المباراة!\n\n🏆 الفائز: ${winner.name}\n   🪙 +80 ذهب | ⭐ +10 هيبة\n💀 الخاسر: ${loser.name}\n   ⭐ -5 هيبة`,
    threadID
  );
}

// ═══════════════════════════════════════
//     معالج دور اللاعب في المعركة
// ═══════════════════════════════════════
function processPlayerAction(api, threadID, battle, battleKey, action, args, elapsed) {
  const p = battle.player;
  const e = battle.enemy;
  const bonus = speedBonus(elapsed);
  let log = [];
  let playerActed = false;

  // تحديث نمط اللاعب
  const pData = loadPlayers()[p.id] || {};
  if (!pData.style) pData.style = { attack: 0, defend: 0, skill: 0, flee: 0 };
  e.aiMemory = e.aiMemory || { attackCount: 0, defendCount: 0, skillCount: 0 };

  if (elapsed < 5000) log.push(`⚡ رد سريع! بونص ×1.15`);
  else if (elapsed > 25000) log.push(`⏰ رد بطيء! عقوبة ×0.7`);

  // ── الهروب ──
  if (action === "هروب" || action === "فرار") {
    if (battle.type === "pvp") return api.sendMessage("🚫 لا يمكن الهروب من PvP!", threadID);
    pData.style.flee++;
    pData.reputation = Math.max(0, (pData.reputation || 0) - 2);
    savePlayer(p.id, pData);
    activeBattles.delete(battleKey);
    if (battle.autoTimer) clearTimeout(battle.autoTimer);
    return api.sendMessage(`🏃 ${p.name} هرب من المعركة!\n⭐ هيبة: -2`, threadID);
  }

  // ── استخدام جرعة ──
  if (action === "جرعة") {
    const potType = args[0] || "hp";
    const potions = p.potions || {};
    const pDataFull = loadPlayers()[p.id] || {};
    pDataFull.potions = pDataFull.potions || {};

    if (potType === "hp" || potType === "الHP" || potType === "صحة") {
      const slot = potions.hp_large > 0 ? "hp_large" : potions.hp > 0 ? "hp" : null;
      if (!slot) return api.sendMessage("❌ ما عندك جرعات HP!\nاشتر من المتجر: متجر جرعات", threadID);
      const heal = slot === "hp_large" ? 100 : 40;
      p.hp = Math.min(p.maxHP, p.hp + heal);
      p.potions[slot] = Math.max(0, (p.potions[slot] || 0) - 1);
      pDataFull.potions[slot] = p.potions[slot];
      savePlayer(p.id, pDataFull);
      playerActed = true;
      log.push(`💚 جرعة HP! +${heal} HP → ${p.hp}/${p.maxHP} (متبقي: ${p.potions[slot]})`);
    } else if (potType === "طاقة" || potType === "stamina") {
      if (!potions.stamina || potions.stamina <= 0) return api.sendMessage("❌ ما عندك جرعات طاقة!\nاشتر من المتجر: متجر جرعات", threadID);
      p.stamina = Math.min(p.maxStamina, p.stamina + 50);
      p.potions.stamina = Math.max(0, (p.potions.stamina || 0) - 1);
      pDataFull.potions.stamina = p.potions.stamina;
      savePlayer(p.id, pDataFull);
      playerActed = true;
      log.push(`⚡ جرعة طاقة! +50 → ${p.stamina}/${p.maxStamina} (متبقي: ${p.potions.stamina})`);
    } else if (potType === "إكسير" || potType === "elixir") {
      const slot2 = potions.divine > 0 ? "divine" : potions.elixir > 0 ? "elixir" : null;
      if (!slot2) return api.sendMessage("❌ ما عندك إكسير!\nاشتر من المتجر: متجر جرعات", threadID);
      const hpGain = slot2 === "divine" ? p.maxHP : 80;
      const stGain = slot2 === "divine" ? p.maxStamina : 50;
      p.hp = Math.min(p.maxHP, p.hp + hpGain);
      p.stamina = Math.min(p.maxStamina, p.stamina + stGain);
      p.potions[slot2] = Math.max(0, (p.potions[slot2] || 0) - 1);
      pDataFull.potions[slot2] = p.potions[slot2];
      savePlayer(p.id, pDataFull);
      playerActed = true;
      log.push(`✨ ${slot2 === "divine" ? "إكسير إلهي" : "إكسير"}! +${hpGain} HP +${stGain} طاقة`);
    } else {
      return api.sendMessage("❓ نوع الجرعة غير معروف\nاستخدم: جرعة hp | جرعة طاقة | جرعة إكسير", threadID);
    }
  }

  // ── التحليل ──
  if (action === "تحليل") {
    const sk = SKILLS["تحليل"];
    if (p.stamina < sk.staminaCost) return api.sendMessage(`❌ طاقة غير كافية! (${sk.staminaCost} مطلوب)`, threadID);
    p.stamina -= sk.staminaCost;
    e.analyzed = true;
    playerActed = true;
    pData.style.skill++;
    e.aiMemory.skillCount++;
    log.push(`🔍 تحليل ناجح!\n💥 نقطة الضعف: استخدام "${e.weakTo}" يزيد الضرر ×2.0!`);
  }

  // ── الدفاع ──
  else if (action === "دفاع" || action === "حماية") {
    p.blocking = true;
    p.stamina = Math.min(p.maxStamina, p.stamina + 8);
    playerActed = true;
    pData.style.defend++;
    e.aiMemory.defendCount++;
    log.push(`🛡 ${p.name} يتخذ موقف دفاعي! يمتص 60% من الضربة + استعادة 8 طاقة`);
  }

  // ── الهجوم الأساسي ──
  else if (action === "ضرب" || action === "هجوم" || action === "attack") {
    const crit = Math.random() < 0.1;
    let mult = bonus;
    if (e.analyzed && "اندفاع" !== e.weakTo) mult *= 1.0;
    const { dmg } = calcDamage(p.atk, e.def, mult, crit);
    const finalDmg = e.blocked ? Math.floor(dmg * 0.2) : dmg;
    e.hp = Math.max(0, e.hp - finalDmg);
    e.blocked = false;
    playerActed = true;
    pData.style.attack++;
    e.aiMemory.attackCount++;
    log.push(`⚔️ ${p.name} يهاجم${crit ? " (ضربة حرجة! 💥)" : ""}! ضرر: ${finalDmg}`);
    if (e.blocked) log.push(`🛡 العدو امتص معظم الضربة!`);
  }

  // ── المهارات ──
  else {
    const skillKey = args[0] || action;
    const sk = SKILLS[skillKey];
    const baseSkillKeys = ["اندفاع","درع","شفاء","غضب","تحليل"];
    if (!sk) {
      const available = baseSkillKeys.concat(p.spells || [], (p.pathPerks||[]).map(pk => {
        const map = { poison_skill:"تسميم", vanish_skill:"اختفاء", predict_skill:"توقع", plan_skill:"تخطيط" };
        return map[pk] || null;
      }).filter(Boolean));
      return api.sendMessage(`❌ مهارة غير معروفة!\nالمتاحة: ${[...new Set(available)].join("، ")}`, threadID);
    }

    // فحص متطلبات التعويذة
    if (sk.requireSpell && !(p.spells || []).includes(sk.requireSpell))
      return api.sendMessage(`❌ تحتاج تعويذة "${sk.requireSpell}" من المتجر\nمتجر تعاويذ`, threadID);
    // فحص متطلبات شجرة التطوير
    if (sk.requirePerk && !(p.pathPerks || []).includes(sk.requirePerk))
      return api.sendMessage(`❌ هذه المهارة تتطلب ترقية شجرة المهارات\nشجرة ← لعرض شجرتك`, threadID);

    const cd = p.skillCooldowns || {};
    if (cd[skillKey] > 0) return api.sendMessage(`⏳ المهارة "${sk.name}" في cooldown (${cd[skillKey]} جولات متبقية)`, threadID);
    // mana surge perk: all skills 50% cheaper
    const actualCost = (p.manaSurge || 0) > 0 ? Math.floor(sk.staminaCost * 0.5) : sk.staminaCost;
    if (p.stamina < actualCost) return api.sendMessage(`❌ طاقة غير كافية! (${actualCost} مطلوب، لديك ${p.stamina})`, threadID);

    p.stamina -= actualCost;
    cd[skillKey] = sk.cd;
    // Tactician perk: cd reduce by 1 extra
    if ((p.pathPerks || []).includes("cd_reduce")) cd[skillKey] = Math.max(0, cd[skillKey] - 1);
    p.skillCooldowns = cd;
    playerActed = true;
    pData.style.skill++;
    e.aiMemory.skillCount++;

    if (sk.effect === "heal") {
      p.hp = Math.min(p.maxHP, p.hp + sk.heal);
      log.push(`💚 شفاء! استعادة ${sk.heal} HP → ${p.hp}/${p.maxHP}`);
    } else if (sk.effect === "block") {
      p.blocking = true;
      p.blockStrong = true;
      log.push(`🛡 درع قوي! يمتص 80% من الضربة القادمة`);
    } else if (sk.effect === "analyze") {
      e.analyzed = true;
      log.push(`🔍 تحليل عميق! ضعف العدو: "${e.weakTo}"`);
    } else if (sk.effect === "poison") {
      e.poisoned = 4;
      log.push(`🐍 تسميم! العدو يخسر 10 HP/جولة لـ 4 جولات`);
    } else if (sk.effect === "vanish") {
      activeBattles.delete(battleKey);
      if (battle.autoTimer) clearTimeout(battle.autoTimer);
      return api.sendMessage(`🌑 اختفاء! ${p.name} هرب وهاجم العدو بـ 30 ضرر!\n(المعركة انتهت)`, threadID);
    } else if (sk.effect === "predict") {
      p.predicting = true;
      log.push(`🎯 توقع! ستتفادى الضربة القادمة تماماً`);
    } else if (sk.effect === "plan") {
      p.planActive = 2;
      log.push(`🎯 تخطيط! ضررك ×2 للجولتين القادمتين`);
    } else if (sk.effect === "burn") {
      e.burning = 3;
      log.push(`🔥 حرق! العدو يخسر 8 HP/جولة لـ 3 جولات`);
    } else if (sk.effect === "slow") {
      e.slowed = true;
      log.push(`🧊 إبطاء! العدو يهاجم بـ -20% للجولة القادمة`);
    } else if (sk.effect === "void") {
      // void ignores armor
      const voidDmg = Math.floor(p.atk * sk.dmg * bonus);
      e.hp = Math.max(0, e.hp - voidDmg);
      log.push(`🌑 فراغ! ضرر ${voidDmg} يتجاهل الدفاع!`);
      if (e.hp <= 0) { api.sendMessage(log.join("\n"), threadID); return endBattle(api, threadID, battleKey, "player", battle); }
    } else if (sk.effect === "mana_surge") {
      p.manaSurge = 3;
      log.push(`⚡ اندفاع سحري! جميع المهارات بـ 50% طاقة لـ 3 جولات`);
    } else if (sk.dmg > 0) {
      let mult = sk.dmg * bonus;
      if ((p.pathPerks||[]).includes("armor_pierce")) mult *= 1.0; // handled in calcDamage
      if (p.planActive > 0) { mult *= 2.0; log.push(`🎯 تخطيط نشط! ×2`); }
      if (e.analyzed && skillKey === e.weakTo) { mult *= 2.0; log.push(`💥 ضربة على نقطة الضعف! ×2`); }
      const crit = Math.random() < (0.12 + (p.critBonus || 0));
      const { dmg } = calcDamage(p.atk, e.def, mult, crit);
      const finalDmg = e.blocked ? Math.floor(dmg * 0.2) : dmg;
      e.hp = Math.max(0, e.hp - finalDmg);
      e.blocked = false;
      if (sk.effect === "stun") { e.stunned = true; log.push(`😵 العدو مذهول! يخسر دوره القادم`); }
      log.push(`${sk.name} → ضرر: ${finalDmg}${crit ? " (حرجي! 🔥)" : ""}`);
    }
  }

  if (!playerActed) return;
  savePlayer(p.id, { ...(loadPlayers()[p.id] || {}), style: pData.style, skillCooldowns: p.skillCooldowns });

  // فحص انتهاء المعركة
  if (e.hp <= 0) {
    api.sendMessage(log.join("\n"), threadID);
    return endBattle(api, threadID, battleKey, "player", battle);
  }

  // ── دور العدو (PvE) ──
  if (battle.type === "pve") {
    const aiMove = monsterAI(e, p, action);
    log.push(`\n${aiMove.msg}`);

    if (aiMove.action === "attack" || aiMove.action === "power") {
      const mult = aiMove.mult || 1.0;
      const { dmg } = calcDamage(e.atk, p.def, mult);
      let finalDmg = dmg;
      if (p.blocking) {
        finalDmg = p.blockStrong ? Math.floor(dmg * 0.2) : Math.floor(dmg * 0.4);
        p.blocking = false; p.blockStrong = false;
        log.push(`🛡 دفاع امتص الضرر! (${finalDmg} وصل)`);
      }
      p.hp = Math.max(0, p.hp - finalDmg);
      log.push(`💔 ضرر واصل إليك: ${finalDmg}`);
    } else if (aiMove.action === "skip") {
      log.push(aiMove.msg);
    }

    // استعادة الطاقة
    p.stamina = Math.min(p.maxStamina, p.stamina + 12);
    e.stamina = Math.min(e.maxStamina, e.stamina + 12);
    battle.turn++;

    if (p.hp <= 0) {
      api.sendMessage(log.join("\n"), threadID);
      return endBattle(api, threadID, battleKey, "enemy", battle);
    }

    // تحديث cooldowns
    const cd = p.skillCooldowns || {};
    for (const k of Object.keys(cd)) { if (cd[k] > 0) cd[k]--; }
    p.skillCooldowns = cd;

    log.push(`\n${battleStatus(battle)}`);
    log.push(`\n⏱ 30 ثانية للرد\nأوامر: ضرب | دفاع | [اسم المهارة] | هروب\nمهاراتك:\n${skillsMenu(p)}`);
    api.sendMessage(log.join("\n"), threadID);

    // Auto-action timer
    if (battle.autoTimer) clearTimeout(battle.autoTimer);
    battle.autoTimer = setTimeout(() => {
      if (!activeBattles.has(battleKey)) return;
      api.sendMessage(`⏰ تأخرت! البوت هاجم عوضاً عنك`, threadID);
      processPlayerAction(api, threadID, battle, battleKey, "ضرب", [], 31000);
    }, 30000);
    activeBattles.set(battleKey, battle);

  } else {
    // PvP — انتظار دور الخصم
    const e2 = battle.enemy;
    p.stamina = Math.min(p.maxStamina, p.stamina + 12);
    battle.turn++;
    battle.currentActor = battle.currentActor === battle.player.id ? e2.id : battle.player.id;

    const cd = p.skillCooldowns || {};
    for (const k of Object.keys(cd)) { if (cd[k] > 0) cd[k]--; }
    p.skillCooldowns = cd;

    log.push(`\n${battleStatus(battle)}`);
    log.push(`\n🎯 دور: ${battle.currentActor === battle.player.id ? battle.player.name : e2.name}`);
    api.sendMessage(log.join("\n"), threadID);

    if (battle.autoTimer) clearTimeout(battle.autoTimer);
    const nextActor = battle.currentActor === battle.player.id ? battle.player : e2;
    battle.autoTimer = setTimeout(() => {
      if (!activeBattles.has(battleKey)) return;
      api.sendMessage(`⏰ ${nextActor.name} تأخر! هجوم تلقائي`, threadID);
      processPvPAction(api, threadID, battle, battleKey, "ضرب", [], 31000, nextActor.id);
    }, 30000);
    activeBattles.set(battleKey, battle);
  }
}

function processPvPAction(api, threadID, battle, battleKey, action, args, elapsed, actorId) {
  const isP1 = actorId === battle.player.id;
  const attacker = isP1 ? battle.player : battle.enemy;
  const defender = isP1 ? battle.enemy : battle.player;

  // نسخ منطق المعركة للـ PvP
  const bonus = speedBonus(elapsed);
  let log = [];
  if (elapsed < 5000) log.push(`⚡ رد سريع! ×1.15`);

  if (action === "دفاع" || action === "حماية") {
    attacker.blocking = true;
    attacker.stamina = Math.min(attacker.maxStamina, attacker.stamina + 8);
    log.push(`🛡 ${attacker.name} يتحصن!`);
  } else if (action === "ضرب" || action === "هجوم") {
    const crit = Math.random() < 0.1;
    const { dmg } = calcDamage(attacker.atk, defender.def, bonus, crit);
    const finalDmg = defender.blocking ? Math.floor(dmg * 0.4) : dmg;
    defender.blocking = false;
    defender.hp = Math.max(0, defender.hp - finalDmg);
    log.push(`⚔️ ${attacker.name} يهاجم${crit ? " (حرجي! 💥)" : ""}! ضرر: ${finalDmg}`);
  } else {
    const sk = SKILLS[action] || SKILLS[args[0]];
    if (sk) {
      const cd = attacker.skillCooldowns || {};
      if (cd[action] > 0) { api.sendMessage(`⏳ الـ cooldown لم ينتهِ (${cd[action]} جولات)`, threadID); return; }
      if (attacker.stamina < sk.staminaCost) { api.sendMessage(`❌ طاقة غير كافية`, threadID); return; }
      attacker.stamina -= sk.staminaCost;
      cd[action] = sk.cd; attacker.skillCooldowns = cd;
      if (sk.heal) { attacker.hp = Math.min(attacker.maxHP, attacker.hp + sk.heal); log.push(`💚 شفاء +${sk.heal}`); }
      else if (sk.dmg > 0) {
        const { dmg } = calcDamage(attacker.atk, defender.def, sk.dmg * bonus);
        const finalDmg = defender.blocking ? Math.floor(dmg * 0.2) : dmg;
        defender.blocking = false;
        defender.hp = Math.max(0, defender.hp - finalDmg);
        if (sk.effect === "stun") { defender.stunned = true; log.push(`😵 ذهول!`); }
        log.push(`${sk.name} → ضرر: ${finalDmg}`);
      } else if (sk.effect === "block") { attacker.blocking = true; attacker.blockStrong = true; log.push(`🛡 درع قوي!`); }
    } else { api.sendMessage(`❌ أمر غير معروف`, threadID); return; }
  }

  if (defender.hp <= 0) {
    api.sendMessage(log.join("\n"), threadID);
    return endPvP(api, threadID, battleKey, actorId, battle);
  }

  // تبديل الدور
  attacker.stamina = Math.min(attacker.maxStamina, attacker.stamina + 12);
  battle.turn++;
  battle.currentActor = battle.currentActor === battle.player.id ? battle.enemy.id : battle.player.id;
  const cd2 = attacker.skillCooldowns || {};
  for (const k of Object.keys(cd2)) { if (cd2[k] > 0) cd2[k]--; }
  attacker.skillCooldowns = cd2;

  log.push(`\n${battleStatus(battle)}`);
  const nextActor = battle.currentActor === battle.player.id ? battle.player : battle.enemy;
  log.push(`🎯 دور: ${nextActor.name}\nأوامر: ضرب | دفاع | [مهارة]`);
  api.sendMessage(log.join("\n"), threadID);

  if (battle.autoTimer) clearTimeout(battle.autoTimer);
  battle.autoTimer = setTimeout(() => {
    if (!activeBattles.has(battleKey)) return;
    api.sendMessage(`⏰ ${nextActor.name} تأخر! هجوم تلقائي`, threadID);
    processPvPAction(api, threadID, battle, battleKey, "ضرب", [], 31000, nextActor.id);
  }, 30000);
  activeBattles.set(battleKey, battle);
}

// ═══════════════════════════════════════
//             الأمر الرئيسي
// ═══════════════════════════════════════
module.exports.config = {
  name: "قتال",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "لعبة قتال Solo Leveling مع وحوش وPvP",
  commandCategory: "ألعاب",
  usages: "قتال | [رد على رسالة شخص] قتال | معلوماتي | مهاراتي | ترتيب",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, mentions } = event;
  const sub = args[0] || "";

  let senderName = senderID;
  try { const info = await api.getUserInfo(senderID); senderName = info[senderID]?.name || senderID; } catch (e) {}

  // ── معلوماتي ──
  if (sub === "معلوماتي" || sub === "احصاء" || sub === "stats") {
    const p = getPlayer(senderID, senderName);
    const expNext = EXP_NEEDED(p.level);
    const expBar  = hpBar(p.exp, expNext, 12);
    const repBar  = hpBar(Math.min(p.reputation||0, 100), 100, 8);
    const wb2 = WEAPON_BONUSES[p.weapon] || {};
    const ab2 = ARMOR_BONUSES[p.armor]   || {};
    return api.sendMessage(
      `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n` +
      `👤 ملف اللاعب\n\n` +
      `🧍 الاسم: ${p.name}\n` +
      `🏅 الرتبة: ${p.rank} — المستوى ${p.level}\n` +
      `📊 XP: [${expBar}] ${p.exp}/${expNext}\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `❤️ HP: ${p.maxHP}  ⚡ طاقة: ${p.maxStamina}\n` +
      `⚔️ هجوم: ${p.atk}${wb2.atk ? ` (+${wb2.atk})` : ""}  🛡 دفاع: ${p.def}${ab2.def ? ` (+${ab2.def})` : ""}\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `⭐ الهيبة: [${repBar}] ${p.reputation || 0}\n` +
      `🪙 الذهب: ${p.coins || 0}\n` +
      `🔷 نقاط مهارة: ${p.skillPoints || 0}\n` +
      (p.path ? `🌿 المسار: ${p.path} (درجة ${(p.pathTiers||[]).length}/4)\n` : `🌿 المسار: غير محدد\n`) +
      (p.guild ? `🏰 المملكة: ${p.guild} [${p.guildRank || "عضو"}]\n` : ``) +
      `━━━━━━━━━━━━━━━━━\n` +
      `🏆 انتصارات: ${p.wins || 0}  💀 هزائم: ${p.losses || 0}\n` +
      `🗡 قتلى: ${p.kills || 0}`,
      threadID, messageID
    );
  }

  // ── مهاراتي ──
  if (sub === "مهاراتي" || sub === "مهارات") {
    const p = getPlayer(senderID, senderName);
    const extraSkills = [];
    if (p.spells) extraSkills.push(...p.spells);
    const perkSkillMap = { poison_skill:"تسميم", vanish_skill:"اختفاء", predict_skill:"توقع", plan_skill:"تخطيط", fire_skill:"نار", magic_shield:"سحر درع", mana_surge:"سحر" };
    for (const perk of (p.pathPerks || [])) { if (perkSkillMap[perk]) extraSkills.push(perkSkillMap[perk]); }
    const allAvailable = [...new Set(["اندفاع","درع","شفاء","غضب","تحليل",...extraSkills])];
    const cd = p.skillCooldowns || {};
    const lines = allAvailable.map(key => {
      const sk = SKILLS[key];
      if (!sk) return null;
      const cdLeft = cd[key] || 0;
      const cdStr = cdLeft > 0 ? ` ⏳CD: ${cdLeft}` : " ✅";
      return `• ${key}: ${sk.desc} | طاقة: ${sk.staminaCost}${cdStr}`;
    }).filter(Boolean);
    return api.sendMessage(
      `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n` +
      `➢ 𝑺𝑲𝑰𝑳𝑳𝑺 (${allAvailable.length})\n\n` +
      lines.join("\n") + `\n\n` +
      `اكتب اسم المهارة أثناء القتال\nجرعة hp | جرعة طاقة | جرعة إكسير`,
      threadID, messageID
    );
  }

  // ── الترتيب ──
  if (sub === "ترتيب" || sub === "رتبة") {
    const all = loadPlayers();
    const sorted = Object.entries(all)
      .sort(([,a],[,b]) => (b.wins||0) - (a.wins||0))
      .slice(0, 10);
    const medals = ["🥇","🥈","🥉"];
    const lines = sorted.map(([,p], i) =>
      `${medals[i] || `${i+1}.`} ${p.name} — Lv.${p.level} ${p.rank} | 🏆${p.wins||0} 💀${p.losses||0}`
    );
    return api.sendMessage(
      `🏆 ترتيب اللاعبين\n\n` +
      (lines.length ? lines.join("\n") : "لا يوجد لاعبون بعد!"),
      threadID, messageID
    );
  }

  // ── PvP (بالرد على رسالة الشخص) ──
  if (event.messageReply && event.messageReply.senderID) {
    const targetID = String(event.messageReply.senderID);
    if (targetID === senderID) return api.sendMessage("❌ لا تقدر تتحدى نفسك!", threadID, messageID);
    try { if (targetID === String(api.getCurrentUserID())) return api.sendMessage("❌ لا تقدر تتحدى البوت!", threadID, messageID); } catch (e) {}

    if (activeBattles.has(`${threadID}_${senderID}`))
      return api.sendMessage("⚔️ أنت في معركة! أنهها أولاً", threadID, messageID);

    const existingChallenge = pvpChallenges.get(`${threadID}_${targetID}`);
    if (existingChallenge)
      return api.sendMessage(`⏳ ${existingChallenge.challengerName} تحدى هذا الشخص بالفعل، انتظر انتهاء التحدي`, threadID, messageID);

    let targetName = targetID;
    try { const info = await api.getUserInfo(targetID); targetName = info[targetID]?.name || targetID; } catch (e) {}

    pvpChallenges.set(`${threadID}_${targetID}`, {
      challengerId: senderID, challengerName: senderName,
      targetId: targetID, targetName,
      threadID, time: Date.now()
    });

    setTimeout(() => pvpChallenges.delete(`${threadID}_${targetID}`), 60000);

    return api.sendMessage(
      `⚔️ تحدي PvP!\n\n⚡ ${senderName} يتحدى ${targetName}!\n\n${targetName}، اكتب:\n✅ قبول ← لقبول التحدي\n❌ رفض ← لرفض التحدي\n\n⏱ التحدي ينتهي خلال 60 ثانية`,
      threadID, messageID
    );
  }

  // ── PvE (مغامرة) ──
  const battleKey = `${threadID}_${senderID}`;
  if (activeBattles.has(battleKey)) {
    return api.sendMessage("⚔️ أنت في معركة! أنهها أولاً", threadID, messageID);
  }

  const pData = getPlayer(senderID, senderName);
  const monster = getMonsterForPlayer(pData);

  // ── تطبيق مكافآت السلاح والدرع ──
  const wb = WEAPON_BONUSES[pData.weapon] || {};
  const ab = ARMOR_BONUSES[pData.armor]   || {};
  let bonusAtk  = wb.atk  || 0;
  let bonusDef  = ab.def  || 0;
  let bonusHP   = ab.hp   || 0;
  let bonusCrit = (wb.crit || 0);
  let bonusDodge= (ab.dodge || 0);
  let armorPen  = (wb.armorPen || 0);

  // ── تطبيق مكافآت شجرة التطوير ──
  const perks = pData.pathPerks || [];
  if (perks.includes("warrior_1")) bonusAtk  = Math.floor(bonusAtk + pData.atk * 0.10);
  if (perks.includes("warrior_2")) bonusHP   += Math.floor(pData.maxHP * 0.15);
  if (perks.includes("crit_boost")) bonusCrit += 0.15;
  if (perks.includes("assassin_4")) armorPen  += 0.30;

  const finalAtk = pData.atk + bonusAtk;
  const finalDef = pData.def + bonusDef;
  const finalHP  = pData.maxHP + bonusHP;

  const player = {
    id: senderID, name: senderName,
    hp: finalHP, maxHP: finalHP,
    stamina: pData.maxStamina, maxStamina: pData.maxStamina,
    atk: finalAtk, def: finalDef, spd: pData.spd,
    blocking: false, blockStrong: false,
    skillCooldowns: { ...(pData.skillCooldowns || {}) },
    spells: pData.spells || [],
    potions: { ...(pData.potions || {}) },
    pathPerks: perks,
    critBonus: bonusCrit,
    dodgeBonus: bonusDodge,
    armorPen,
    path: pData.path || null,
    ironWillUsed: false,
    planActive: 0,
    manaSurge: 0,
  };

  const battle = {
    type: "pve",
    player, enemy: monster,
    turn: 1, currentActor: senderID,
    threadID, turnStartTime: Date.now(), autoTimer: null
  };

  activeBattles.set(battleKey, battle);

  const startMsg =
    `⚔️ بداية المعركة!\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `🧍 ${player.name} [Lv.${pData.level} ${pData.rank}]\n` +
    `👹 ${monster.name} [رتبة ${pData.rank}]\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `${battleStatus(battle)}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `⏱ 30 ثانية للرد!\nأوامر: ضرب | دفاع | [اسم المهارة] | هروب\n\nالمهارات:\n${skillsMenu(player)}`;

  api.sendMessage(startMsg, threadID);

  battle.autoTimer = setTimeout(() => {
    if (!activeBattles.has(battleKey)) return;
    api.sendMessage(`⏰ تأخرت! البوت هاجم عوضاً عنك`, threadID);
    processPlayerAction(api, threadID, battle, battleKey, "ضرب", [], 31000);
  }, 30000);
};

// ═══════════════════════════════════════
//           استقبال ردود المعركة
// ═══════════════════════════════════════
module.exports.handleEvent = async function({ api, event }) {
  if (!event.body) return;
  const body = event.body.trim();
  const { threadID, senderID } = event;

  // قبول/رفض PvP
  const challengeKey = `${threadID}_${senderID}`;
  if (pvpChallenges.has(challengeKey) && (body === "قبول" || body === "رفض")) {
    const ch = pvpChallenges.get(challengeKey);
    pvpChallenges.delete(challengeKey);

    if (body === "رفض") {
      return api.sendMessage(`❌ ${ch.targetName} رفض التحدي!`, threadID);
    }

    // ابدأ PvP
    const p1Data = getPlayer(ch.challengerId, ch.challengerName);
    const p2Data = getPlayer(ch.targetId, ch.targetName);
    const p1 = { id: ch.challengerId, name: ch.challengerName, hp: p1Data.maxHP, maxHP: p1Data.maxHP, stamina: p1Data.maxStamina, maxStamina: p1Data.maxStamina, atk: p1Data.atk, def: p1Data.def, blocking: false, blockStrong: false, stunned: false, skillCooldowns: { ...(p1Data.skillCooldowns || {}) } };
    const p2 = { id: ch.targetId, name: ch.targetName, hp: p2Data.maxHP, maxHP: p2Data.maxHP, stamina: p2Data.maxStamina, maxStamina: p2Data.maxStamina, atk: p2Data.atk, def: p2Data.def, blocking: false, blockStrong: false, stunned: false, skillCooldowns: { ...(p2Data.skillCooldowns || {}) } };

    const battle = {
      type: "pvp", player: p1, enemy: p2,
      turn: 1, currentActor: p1.id,
      threadID, autoTimer: null
    };

    const bk = `${threadID}_pvp_${p1.id}_${p2.id}`;
    activeBattles.set(bk, battle);
    // حفظ مرجع للمعركة لكلا اللاعبين
    activeBattles.set(`pvpref_${threadID}_${p1.id}`, bk);
    activeBattles.set(`pvpref_${threadID}_${p2.id}`, bk);

    api.sendMessage(
      `⚔️ بداية PvP!\n${p1.name} ضد ${p2.name}\n\n${battleStatus(battle)}\n\n🎯 دور: ${p1.name}\nأوامر: ضرب | دفاع | [مهارة]`,
      threadID
    );

    battle.autoTimer = setTimeout(() => {
      if (!activeBattles.has(bk)) return;
      api.sendMessage(`⏰ ${p1.name} تأخر! هجوم تلقائي`, threadID);
      processPvPAction(api, threadID, battle, bk, "ضرب", [], 31000, p1.id);
    }, 30000);
    return;
  }

  // المعركة العادية (PvE)
  const battleKey = `${threadID}_${senderID}`;
  if (activeBattles.has(battleKey)) {
    const battle = activeBattles.get(battleKey);
    if (battle.type !== "pve") return;
    const elapsed = Date.now() - (battle.turnStartTime || Date.now());
    battle.turnStartTime = Date.now();
    if (battle.autoTimer) clearTimeout(battle.autoTimer);

    const tokens = body.split(/\s+/);
    const action = tokens[0];
    const args = tokens.slice(1);
    return processPlayerAction(api, threadID, battle, battleKey, action, args, elapsed);
  }

  // معركة PvP — فحص المرجع
  const pvpRefKey = `pvpref_${threadID}_${senderID}`;
  if (activeBattles.has(pvpRefKey)) {
    const bk = activeBattles.get(pvpRefKey);
    const battle = activeBattles.get(bk);
    if (!battle) return;
    if (battle.currentActor !== senderID) return;

    const elapsed = Date.now() - (battle.turnStartTime || Date.now());
    battle.turnStartTime = Date.now();
    if (battle.autoTimer) clearTimeout(battle.autoTimer);

    const tokens = body.split(/\s+/);
    return processPvPAction(api, threadID, battle, bk, tokens[0], tokens.slice(1), elapsed, senderID);
  }
};
