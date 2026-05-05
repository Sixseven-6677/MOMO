const fs = require("fs");
const path = require("path");
const dataDir = path.join(process.cwd(), "Horizon_Database");
const playersPath = path.join(dataDir, "qetal_players.json");

function loadPlayers() {
  try { if (!fs.existsSync(playersPath)) return {}; return JSON.parse(fs.readFileSync(playersPath, "utf8")); } catch { return {}; }
}
function savePlayers(d) {
  try { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(playersPath, JSON.stringify(d, null, 2)); } catch {}
}
function savePlayer(id, data) { const all = loadPlayers(); all[id] = data; savePlayers(all); }

// ═══════════════════════════════════════
//         شجرة الإقليم (6 أقاليم)
// ═══════════════════════════════════════
const REGION_TREES = {
  kohen: {
    name: "كوهين 🔥", element: "النار",
    tiers: [
      { id: "k1", cost: 1, name: "لهب المبتدئ",     desc: "+12% هجوم دائم",                                    stat: "atk", mult: 1.12 },
      { id: "k2", cost: 2, name: "درع النار",        desc: "منيع ضد تأثير الحرق + +10% هجوم",                  stat: "atk", mult: 1.10, perk: "fire_immune" },
      { id: "k3", cost: 3, name: "غضب جهنم",         desc: "مهارة غضب الآن ×3.5 ضرر بدل ×2.5",                perk: "fury_upgrade" },
      { id: "k4", cost: 5, name: "إرادة الفينيق",    desc: "مرة واحدة/معركة: إذا وصل HP للصفر يعود بـ 30% HP", perk: "phoenix_will" },
      { id: "k5", cost: 8, name: "الملك الأحمر 👑",  desc: "جميع تعاويذ النار ×2 ضرر + الحرق التلقائي يتضاعف", perk: "fire_king" },
    ]
  },
  jisao: {
    name: "جيساو 🌊", element: "الماء",
    tiers: [
      { id: "j1", cost: 1, name: "نسيم المحيط",      desc: "+25% فعالية الشفاء دائم",              perk: "heal_boost" },
      { id: "j2", cost: 2, name: "التيار الدفاعي",   desc: "أول ضربة في المعركة تُمتص 50%",        perk: "water_shield" },
      { id: "j3", cost: 3, name: "تجديد الطاقة",     desc: "يستعيد 22 طاقة/جولة بدل 12",           perk: "stamina_regen" },
      { id: "j4", cost: 5, name: "جليد المعالج",     desc: "تعويذة جليد تشفي 35 HP للمستخدم أيضاً", perk: "ice_heal" },
      { id: "j5", cost: 8, name: "الملك الأزرق 👑",  desc: "HP regen ×3 + طاقة regen ×2 كل جولة", perk: "water_king" },
    ]
  },
  marlin: {
    name: "مارلين 🌪️", element: "الرياح",
    tiers: [
      { id: "m1", cost: 1, name: "ريح الصحراء",      desc: "+18% احتمالية التفادي دائم",            perk: "dodge_boost" },
      { id: "m2", cost: 2, name: "ضربة البرق",        desc: "اندفاع CD يصبح جولة واحدة فقط",        perk: "rush_cd" },
      { id: "m3", cost: 3, name: "عاصفة متعاقبة",    desc: "اندفاع يضرب مرتين في نفس الدور",       perk: "double_rush" },
      { id: "m4", cost: 5, name: "انتقام الريح",     desc: "عند تفادي ضربة: هجوم فوري 60% هجوم",   perk: "wind_counter" },
      { id: "m5", cost: 8, name: "الملك الأبيض 👑",  desc: "30% تفادي ثابت + الهجوم المضاد ×2",    perk: "wind_king" },
    ]
  },
  bastard: {
    name: "باستارد 🌑", element: "الظلام",
    tiers: [
      { id: "b1", cost: 1, name: "سم متطور",          desc: "السم يصل 18 ضرر/جولة بدل 10",         perk: "poison_upgrade" },
      { id: "b2", cost: 2, name: "ظلام البداية",      desc: "مدة التأثيرات السلبية +2 جولة إضافية", perk: "debuff_extend" },
      { id: "b3", cost: 3, name: "الاختفاء المزدوج",  desc: "اختفاء يطبّق السم أيضاً",              perk: "vanish_poison" },
      { id: "b4", cost: 5, name: "أعماق الفراغ",      desc: "تعويذة فراغ تُخدّر الخصم جولتين",      perk: "void_stun" },
      { id: "b5", cost: 8, name: "الملك الأسود 👑",   desc: "كل هجوم يسمّم تلقائياً + فراغ يتجاهل كامل الدفاع", perk: "dark_king" },
    ]
  },
  shinsako: {
    name: "الشينساكو 🪨", element: "الصخر",
    tiers: [
      { id: "s1", cost: 1, name: "بنية صخرية",        desc: "+28% دفاع دائم",                       stat: "def", mult: 1.28 },
      { id: "s2", cost: 2, name: "درع الجبل",         desc: "الدرع يمتص 92% بدل 80% من الضربة",     perk: "rock_block" },
      { id: "s3", cost: 3, name: "انعكاس الصخر",     desc: "يعكس 30% من الضرر المحجوب للخصم",      perk: "damage_reflect" },
      { id: "s4", cost: 5, name: "حصن القلعة",        desc: "عند HP أقل 30%: 55% تخفيف ضرر",        perk: "fortress" },
      { id: "s5", cost: 8, name: "الملك الرمادي 👑",  desc: "منيع من جميع التأثيرات + انعكاس 50%",   perk: "rock_king" },
    ]
  },
  zourd: {
    name: "الزورد ✨", element: "النور",
    tiers: [
      { id: "z1", cost: 1, name: "ضوء الفجر",         desc: "+12% لجميع الإحصاءات",                 perk: "all_stats_1" },
      { id: "z2", cost: 2, name: "بصيرة النور",       desc: "تحليل يخفض دفاع الخصم 25% لـ 3 جولات", perk: "analyze_debuff" },
      { id: "z3", cost: 3, name: "مدافع النور",       desc: "توقع يشفي 30 HP عند التفادي",           perk: "predict_heal" },
      { id: "z4", cost: 5, name: "قوة النور المقدس",  desc: "تكلفة جميع المهارات -30% طاقة",         perk: "skill_discount" },
      { id: "z5", cost: 8, name: "الملك الذهبي 👑",   desc: "الطاقة لا تقل عن 25 أبداً + مهارات ×1.5", perk: "light_king" },
    ]
  }
};

// ═══════════════════════════════════════
//         مسارات الفئة (Class Paths)
// ═══════════════════════════════════════
const PATHS = {
  محارب: {
    icon: "⚔️", nameEn: "Warrior", desc: "قوة هجوم هائلة وصلابة لا تُكسر",
    tiers: [
      { id: "warrior_1", cost: 1, name: "قوة المحارب",      desc: "+10% هجوم دائم",                           stat: "atk", mult: 1.10 },
      { id: "warrior_2", cost: 2, name: "صلابة الجسد",      desc: "+15% HP الأقصى",                           stat: "maxHP", mult: 1.15 },
      { id: "warrior_3", cost: 3, name: "غضب الحرب",        desc: "عند HP < 30% يتضاعف هجومك تلقائياً",      perk: "warrior_rage" },
      { id: "warrior_4", cost: 5, name: "إرادة الحديد",     desc: "مرة/معركة: تبقى بـ 1 HP بدل الموت",       perk: "iron_will" },
    ]
  },
  اغتيال: {
    icon: "🗡", nameEn: "Assassin", desc: "سرعة وضربات حرجة تُنهي المعارك",
    tiers: [
      { id: "assassin_1", cost: 1, name: "حافة الظل",       desc: "+15% احتمالية ضربة حرجة",                 perk: "crit_boost" },
      { id: "assassin_2", cost: 2, name: "سم الشفرة",       desc: "مهارة: تسميم",                             perk: "poison_skill" },
      { id: "assassin_3", cost: 3, name: "الاختفاء",        desc: "مهارة: هروب مضمون + هجوم مضاد",           perk: "vanish_skill" },
      { id: "assassin_4", cost: 5, name: "الاغتيال المطلق", desc: "جميع الضربات تتجاهل 30% دفاع الخصم",     perk: "armor_pierce" },
    ]
  },
  ساحر: {
    icon: "🔮", nameEn: "Mage", desc: "سحر مدمر واستعادة طاقة لا حدود لها",
    tiers: [
      { id: "mage_1", cost: 1, name: "تأمل عميق",          desc: "+20% طاقة قصوى",                          stat: "maxStamina", mult: 1.20 },
      { id: "mage_2", cost: 2, name: "درع السحر",          desc: "يمتص أول 100 ضرر لكل معركة",              perk: "magic_shield" },
      { id: "mage_3", cost: 3, name: "مهارة: توقع",        desc: "يتفادى الضربة القادمة تماماً",             perk: "predict_skill" },
      { id: "mage_4", cost: 5, name: "اندفاع السحر",       desc: "جميع المهارات بـ 50% طاقة لـ 3 جولات",    perk: "mana_surge" },
    ]
  },
  تكتيكي: {
    icon: "🎯", nameEn: "Tactician", desc: "التخطيط والتحليل يُسقطان أي خصم",
    tiers: [
      { id: "tactician_1", cost: 1, name: "رد الفعل",      desc: "عند الدفاع: ترد 25% ضرر للخصم",           perk: "counter_perk" },
      { id: "tactician_2", cost: 2, name: "مهارة: تخطيط",  desc: "×2 ضرر للجولتين القادمتين",               perk: "plan_skill" },
      { id: "tactician_3", cost: 3, name: "تكتيك متقدم",   desc: "جميع Cooldowns تُخفَّض بـ 1 إضافي",       perk: "cd_reduce" },
      { id: "tactician_4", cost: 5, name: "مهارة: توقع",   desc: "يتفادى الضربة القادمة تماماً",             perk: "predict_skill" },
    ]
  }
};

function drawRegionTree(pData) {
  const rt = REGION_TREES[pData.regionId];
  if (!rt) return "❌ لا توجد شجرة إقليم (سجّل أولاً)";
  const unlocked = pData.regionTiers || [];
  let lines = [
    `🌿 𝑹𝑬𝑮𝑰𝑶𝑵 𝑻𝑹𝑬𝑬 — ${rt.name}`,
    `━━━━━━━━━━━━━━━━━`,
    `🔷 نقاط متاحة: ${pData.skillPoints || 0}`,
    `━━━━━━━━━━━━━━━━━`
  ];
  rt.tiers.forEach((tier, i) => {
    const isUnlocked = unlocked.includes(tier.id);
    const prevOk = i === 0 || unlocked.includes(rt.tiers[i - 1].id);
    const canAfford = (pData.skillPoints || 0) >= tier.cost;
    const icon = isUnlocked ? "✅" : (prevOk && canAfford ? "🔓" : "🔒");
    lines.push(`${icon} ${i + 1}. ${tier.name} (${tier.cost} نقطة)`);
    lines.push(`   └ ${tier.desc}`);
  });
  lines.push(`━━━━━━━━━━━━━━━━━`);
  lines.push(`للترقية: شجرة إقليم [رقم 1-5]`);
  return lines.join("\n");
}

function drawPathTree(pData) {
  if (!pData.path) {
    const list = Object.entries(PATHS).map(([k, p]) => `${p.icon} ${k} — ${p.desc}`).join("\n");
    return `⚔️ 𝑪𝑳𝑨𝑺𝑺 𝑻𝑹𝑬𝑬\n━━━━━━━━━━━━━━━━━\n🔷 نقاط: ${pData.skillPoints || 0}\n\nاختر فئتك:\n${list}\n\nللاختيار: شجرة مسار [الاسم]`;
  }
  const pd = PATHS[pData.path];
  const unlocked = pData.pathTiers || [];
  let lines = [
    `⚔️ 𝑪𝑳𝑨𝑺𝑺 𝑻𝑹𝑬𝑬 — ${pd.icon} ${pData.path}`,
    `━━━━━━━━━━━━━━━━━`,
    `🔷 نقاط: ${pData.skillPoints || 0}`,
    `━━━━━━━━━━━━━━━━━`
  ];
  pd.tiers.forEach((tier, i) => {
    const isUnlocked = unlocked.includes(tier.id);
    const prevOk = i === 0 || unlocked.includes(pd.tiers[i - 1].id);
    const canAfford = (pData.skillPoints || 0) >= tier.cost;
    const icon = isUnlocked ? "✅" : (prevOk && canAfford ? "🔓" : "🔒");
    lines.push(`${icon} ${i + 1}. ${tier.name} (${tier.cost} نقطة)`);
    lines.push(`   └ ${tier.desc}`);
  });
  lines.push(`━━━━━━━━━━━━━━━━━`);
  lines.push(`للترقية: شجرة ترقية [رقم 1-4]`);
  return lines.join("\n");
}

module.exports.config = {
  name: "شجرة",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "شجرة تطوير الإقليم والفئة — طور قدراتك",
  commandCategory: "نظام",
  usages: "شجرة | شجرة إقليم [رقم] | شجرة مسار [اسم] | شجرة ترقية [رقم]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const all = loadPlayers();
  const pData = all[senderID];

  if (!pData || !pData.registered) {
    return api.sendMessage("❌ يجب التسجيل أولاً!\nاكتب: تسجيل", threadID, messageID);
  }

  const sub = args[0] || "";

  // ── عرض الشجرتين ──
  if (!sub || sub === "عرض") {
    const regionSection = drawRegionTree(pData);
    const pathSection   = drawPathTree(pData);
    return api.sendMessage(
      `${regionSection}\n\n━━━━━━━━━━━━━━━━━\n\n${pathSection}`,
      threadID, messageID
    );
  }

  // ── ترقية شجرة الإقليم ──
  if (sub === "إقليم") {
    const tierNum = parseInt(args[1]);
    if (isNaN(tierNum) || tierNum < 1 || tierNum > 5)
      return api.sendMessage("❌ رقم الدرجة من 1 إلى 5", threadID, messageID);

    const rt = REGION_TREES[pData.regionId];
    if (!rt) return api.sendMessage("❌ إقليمك غير معروف، تواصل مع المطور", threadID, messageID);

    const tier = rt.tiers[tierNum - 1];
    const unlocked = pData.regionTiers || [];

    if (unlocked.includes(tier.id))
      return api.sendMessage("✅ هذه الدرجة مفتوحة بالفعل!", threadID, messageID);
    if (tierNum > 1 && !unlocked.includes(rt.tiers[tierNum - 2].id))
      return api.sendMessage("❌ افتح الدرجة السابقة أولاً", threadID, messageID);
    if ((pData.skillPoints || 0) < tier.cost)
      return api.sendMessage(`❌ نقاط غير كافية! تحتاج ${tier.cost}، لديك ${pData.skillPoints || 0}`, threadID, messageID);

    pData.skillPoints -= tier.cost;
    pData.regionTiers = [...unlocked, tier.id];
    if (tier.stat && tier.mult) pData[tier.stat] = Math.floor((pData[tier.stat] || 100) * tier.mult);
    if (tier.perk) pData.pathPerks = [...(pData.pathPerks || []), tier.perk];

    savePlayer(senderID, pData);
    return api.sendMessage(
      `🔓 تم فتح درجة الإقليم ${tierNum}: ${tier.name}!\n✨ ${tier.desc}\n🔷 نقاط متبقية: ${pData.skillPoints}`,
      threadID, messageID
    );
  }

  // ── اختيار مسار الفئة ──
  if (sub === "مسار") {
    if (pData.path) return api.sendMessage(`❌ فئتك: ${pData.path} — لا يمكن تغييرها`, threadID, messageID);
    const chosen = args[1];
    if (!chosen || !PATHS[chosen])
      return api.sendMessage(`❌ الفئات: ${Object.keys(PATHS).join(" | ")}`, threadID, messageID);
    pData.path = chosen; pData.pathTiers = []; pData.pathPerks = pData.pathPerks || [];
    savePlayer(senderID, pData);
    return api.sendMessage(
      `🎉 اخترت فئة ${PATHS[chosen].icon} ${chosen}!\n${PATHS[chosen].desc}\n\nشجرة ترقية [رقم] للترقية\nنقاطك: ${pData.skillPoints || 0}`,
      threadID, messageID
    );
  }

  // ── ترقية مسار الفئة ──
  if (sub === "ترقية") {
    if (!pData.path) return api.sendMessage("❌ اختر فئتك أولاً: شجرة مسار [اسم]", threadID, messageID);
    const tierNum = parseInt(args[1]);
    if (isNaN(tierNum) || tierNum < 1 || tierNum > 4)
      return api.sendMessage("❌ رقم الدرجة من 1 إلى 4", threadID, messageID);

    const pd = PATHS[pData.path];
    const tier = pd.tiers[tierNum - 1];
    const unlocked = pData.pathTiers || [];

    if (unlocked.includes(tier.id)) return api.sendMessage("✅ هذه الدرجة مفتوحة!", threadID, messageID);
    if (tierNum > 1 && !unlocked.includes(pd.tiers[tierNum - 2].id))
      return api.sendMessage("❌ افتح الدرجة السابقة أولاً", threadID, messageID);
    if ((pData.skillPoints || 0) < tier.cost)
      return api.sendMessage(`❌ تحتاج ${tier.cost} نقطة، لديك ${pData.skillPoints || 0}`, threadID, messageID);

    pData.skillPoints -= tier.cost;
    pData.pathTiers = [...unlocked, tier.id];
    if (tier.stat && tier.mult) pData[tier.stat] = Math.floor((pData[tier.stat] || 100) * tier.mult);
    if (tier.perk) pData.pathPerks = [...(pData.pathPerks || []), tier.perk];

    savePlayer(senderID, pData);
    return api.sendMessage(
      `🔓 تم فتح الدرجة ${tierNum}: ${tier.name}!\n✨ ${tier.desc}\n🔷 نقاط متبقية: ${pData.skillPoints}`,
      threadID, messageID
    );
  }

  return api.sendMessage(
    "❓ الأوامر المتاحة:\nشجرة — عرض الكل\nشجرة إقليم [1-5] — ترقية شجرة الإقليم\nشجرة مسار [اسم] — اختيار الفئة\nشجرة ترقية [1-4] — ترقية الفئة",
    threadID, messageID
  );
};
