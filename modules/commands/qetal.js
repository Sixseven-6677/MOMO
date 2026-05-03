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
  اندفاع:   { name: "اندفاع ⚡",  dmg: 1.8, heal: 0, staminaCost: 20, cd: 2, effect: null, desc: "ضربة سريعة ×1.8" },
  درع:      { name: "درع 🛡",    dmg: 0,   heal: 0, staminaCost: 25, cd: 3, effect: "block", desc: "يمتص 80% من الضربة القادمة" },
  شفاء:     { name: "شفاء 💚",   dmg: 0,   heal: 40, staminaCost: 30, cd: 4, effect: "heal", desc: "يستعيد 40 نقطة HP" },
  غضب:      { name: "غضب 🔥",    dmg: 2.5, heal: 0, staminaCost: 40, cd: 5, effect: "stun", desc: "ضربة مدمرة ×2.5 + ذهول للعدو" },
  تحليل:    { name: "تحليل 🔍",  dmg: 0,   heal: 0, staminaCost: 15, cd: 3, effect: "analyze", desc: "يكشف نقطة ضعف الخصم" },
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
    `⚔️ 𝑯𝑼𝑵𝑻𝑬𝑹 𝑩𝑨𝑻𝑻𝑳𝑬 — الجولة ${battle.turn}\n` +
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
    savePlayer(p.id, pData);

    let msg = `🏆 𝑽𝑰𝑪𝑻𝑶𝑹𝒀!\n\n${p.name} انتصر على ${battle.enemy.name}!\n`;
    msg += `💰 XP: +${battle.enemy.exp}\n`;
    if (leveledUp) msg += `🎉 مبروك! ترقية للمستوى ${pData.level} (الرتبة ${pData.rank})!\n`;
    return api.sendMessage(msg, threadID);
  } else {
    pData.losses = (pData.losses || 0) + 1;
    pData.skillCooldowns = pData.skillCooldowns || {};
    savePlayer(p.id, pData);
    return api.sendMessage(
      `💀 𝑫𝑬𝑭𝑬𝑨𝑻!\n\n${p.name} سقط أمام ${battle.enemy.name}!\nتدرب أكثر وحاول مجدداً...\n\n🔁 قتال مجدداً: اكتب قتال`,
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
  if (allP[winnerId]) { allP[winnerId].wins = (allP[winnerId].wins || 0) + 1; }
  if (allP[loser.id]) { allP[loser.id].losses = (allP[loser.id].losses || 0) + 1; }
  savePlayers(allP);

  return api.sendMessage(
    `⚔️ 𝑷𝒗𝑷 𝑬𝑵𝑫𝑬𝑫!\n\n🏆 الفائز: ${winner.name}\n💀 الخاسر: ${loser.name}`,
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
    savePlayer(p.id, pData);
    activeBattles.delete(battleKey);
    if (battle.autoTimer) clearTimeout(battle.autoTimer);
    return api.sendMessage(`🏃 ${p.name} هرب من المعركة!`, threadID);
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
    if (!sk) return api.sendMessage(`❌ مهارة غير معروفة!\nالمهارات المتاحة: ${Object.keys(SKILLS).join("، ")}`, threadID);

    const cd = p.skillCooldowns || {};
    if (cd[skillKey] > 0) return api.sendMessage(`⏳ المهارة "${sk.name}" في cooldown (${cd[skillKey]} جولات متبقية)`, threadID);
    if (p.stamina < sk.staminaCost) return api.sendMessage(`❌ طاقة غير كافية! (${sk.staminaCost} مطلوب، لديك ${p.stamina})`, threadID);

    p.stamina -= sk.staminaCost;
    cd[skillKey] = sk.cd;
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
    } else if (sk.dmg > 0) {
      let mult = sk.dmg * bonus;
      if (e.analyzed && skillKey === e.weakTo) { mult *= 2.0; log.push(`💥 ضربة على نقطة الضعف! ×2`); }
      const crit = Math.random() < 0.12;
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
    const bar = hpBar(p.exp, expNext, 12);
    return api.sendMessage(
      `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n` +
      `➢ 𝑯𝑼𝑵𝑻𝑬𝑹 𝑷𝑹𝑶𝑭𝑰𝑳𝑬\n\n` +
      `🧍 الاسم: ${p.name}\n` +
      `🏅 الرتبة: ${p.rank} — المستوى ${p.level}\n` +
      `📊 XP: [${bar}] ${p.exp}/${expNext}\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `❤️ HP: ${p.maxHP}  ⚡ طاقة: ${p.maxStamina}\n` +
      `⚔️ هجوم: ${p.atk}  🛡 دفاع: ${p.def}  💨 سرعة: ${p.spd}\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `🏆 انتصارات: ${p.wins}  💀 هزائم: ${p.losses}\n` +
      `🗡 قتلى: ${p.kills}`,
      threadID, messageID
    );
  }

  // ── مهاراتي ──
  if (sub === "مهاراتي" || sub === "مهارات") {
    const p = getPlayer(senderID, senderName);
    return api.sendMessage(
      `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n` +
      `➢ 𝑺𝑲𝑰𝑳𝑳𝑺\n\n` +
      skillsMenu(p) + `\n\n` +
      `طريقة الاستخدام: اكتب اسم المهارة أثناء القتال\nمثال: اندفاع | درع | شفاء | غضب | تحليل`,
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
      `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n➢ 𝑳𝑬𝑨𝑫𝑬𝑹𝑩𝑶𝑨𝑹𝑫\n\n` +
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

  const player = {
    id: senderID, name: senderName,
    hp: pData.maxHP, maxHP: pData.maxHP,
    stamina: pData.maxStamina, maxStamina: pData.maxStamina,
    atk: pData.atk, def: pData.def, spd: pData.spd,
    blocking: false, blockStrong: false,
    skillCooldowns: { ...(pData.skillCooldowns || {}) }
  };

  const battle = {
    type: "pve",
    player, enemy: monster,
    turn: 1, currentActor: senderID,
    threadID, turnStartTime: Date.now(), autoTimer: null
  };

  activeBattles.set(battleKey, battle);

  const startMsg =
    `⚔️ 𝑩𝑨𝑻𝑻𝑳𝑬 𝑺𝑻𝑨𝑹𝑻!\n` +
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
      `⚔️ 𝑷𝒗𝑷 𝑺𝑻𝑨𝑹𝑻!\n${p1.name} ضد ${p2.name}\n\n${battleStatus(battle)}\n\n🎯 دور: ${p1.name}\nأوامر: ضرب | دفاع | [مهارة]`,
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
