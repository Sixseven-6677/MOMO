const fs = require("fs");
const path = require("path");
const dataDir = path.join(__dirname, "data");
const playersPath = path.join(dataDir, "qetal_players.json");

const pendingReg = global.pendingRegistrations || (global.pendingRegistrations = new Map());

// ═══════════════════════════════════════
//            بيانات الأقاليم
// ═══════════════════════════════════════
const REGIONS = {
  "1": {
    id: "kohen", name: "كوهين", element: "النار", emoji: "🔥",
    bonus: { atk: 1.15, maxHP: 0.95 },
    passive: { id: "burn_passive", name: "جمر 🔥", desc: "20% احتمال إحراق الخصم عند كل هجوم (8 ضرر/جولة × 3 جولات)" },
    startSpells: ["نار"],
    statText: "⚔️ هجوم +15% | ❤️ HP -5%",
    desc: "إقليم النار المندفع — قوة تدميرية هائلة ولكن دفاع أضعف"
  },
  "2": {
    id: "jisao", name: "جيساو", element: "الماء", emoji: "🌊",
    bonus: { maxHP: 1.15, healMult: 1.6 },
    passive: { id: "regen_passive", name: "تيار الحياة 🌊", desc: "يستعيد 8 HP تلقائياً في كل جولة" },
    startSpells: ["جليد"],
    statText: "❤️ HP +15% | 💚 شفاء +60%",
    desc: "إقليم الماء الصامد — صبر لا ينضب وقدرة شفاء لا مثيل لها"
  },
  "3": {
    id: "marlin", name: "مارلين", element: "الرياح", emoji: "🌪️",
    bonus: { dodge: 0.15, atkMult: 1.05 },
    passive: { id: "dodge_passive", name: "عين العاصفة 🌪️", desc: "15% احتمال تفادي أي هجوم تلقائياً" },
    startSpells: ["صاعقة"],
    statText: "🌀 تفادي +15% | ⚡ هجوم اندفاع مضاعف",
    desc: "إقليم الرياح الخاطف — السرعة والمراوغة سلاحك الأمضى"
  },
  "4": {
    id: "bastard", name: "باستارد", element: "الظلام", emoji: "🌑",
    bonus: { poisonMult: 2, debuffDur: 2 },
    passive: { id: "poison_passive", name: "لدغة الظلام 🌑", desc: "25% احتمال تسميم الخصم تلقائياً عند كل هجوم" },
    startSpells: ["فراغ"],
    statText: "🐍 سم ×2 | 🌑 مدة التأثيرات +2 جولة",
    desc: "إقليم الظلام الماكر — السم والدهاء يسقطان أقوى الخصوم"
  },
  "5": {
    id: "shinsako", name: "الشينساكو", element: "الصخر", emoji: "🪨",
    bonus: { def: 1.20, maxHP: 1.20 },
    passive: { id: "rock_passive", name: "جلد الصخر 🪨", desc: "يخفف جميع الضرر الواصل بنسبة 15% دائماً" },
    startSpells: ["جليد"],
    statText: "🛡 دفاع +20% | ❤️ HP +20%",
    desc: "إقليم الصخر الراسخ — دفاع منيع يجعلك قلعة لا تُهزم"
  },
  "6": {
    id: "zourd", name: "الزورد", element: "النور", emoji: "✨",
    bonus: { atk: 1.10, def: 1.10, maxHP: 1.10, maxStamina: 1.10 },
    passive: { id: "light_passive", name: "هالة النور ✨", desc: "جميع المهارات تكلف 15% طاقة أقل" },
    startSpells: ["صاعقة"],
    statText: "✨ جميع الإحصاءات +10%",
    desc: "إقليم النور المتوازن — قوة شاملة في جميع الجوانب"
  }
};

function loadPlayers() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(playersPath)) return {};
    return JSON.parse(fs.readFileSync(playersPath, "utf8"));
  } catch { return {}; }
}
function savePlayers(d) {
  try { fs.writeFileSync(playersPath, JSON.stringify(d, null, 2)); } catch {}
}
function savePlayer(id, data) { const all = loadPlayers(); all[id] = data; savePlayers(all); }

function applyRegionBonuses(pData, region) {
  const b = region.bonus;
  if (b.atk)        pData.atk         = Math.floor((pData.atk || 18) * b.atk);
  if (b.def)        pData.def         = Math.floor((pData.def || 6)  * b.def);
  if (b.maxHP)      pData.maxHP       = Math.floor((pData.maxHP || 120) * b.maxHP);
  if (b.maxStamina) pData.maxStamina  = Math.floor((pData.maxStamina || 100) * b.maxStamina);
  pData.spells = [...(pData.spells || []), ...region.startSpells.filter(s => !(pData.spells || []).includes(s))];
  pData.regionPassive = region.passive.id;
  pData.regionId = region.id;
  pData.dodge = b.dodge || pData.dodge || 0;
  pData.healMult = b.healMult || 1;
  pData.poisonMult = b.poisonMult || 1;
  pData.debuffDur = b.debuffDur || 0;
  return pData;
}

module.exports.config = {
  name: "تسجيل",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "تسجيل في نظام Global Solo Leveling",
  commandCategory: "نظام",
  usages: "تسجيل",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const all = loadPlayers();

  if (all[senderID] && all[senderID].registered) {
    const p = all[senderID];
    const r = Object.values(REGIONS).find(r => r.id === p.regionId) || {};
    return api.sendMessage(
      `✅ أنت مسجّل بالفعل!\n\n👤 الاسم: ${p.playerName}\n🌍 الإقليم: ${r.name || p.region} ${r.emoji || ""}\n⚔️ الرتبة: ${p.rank} | المستوى: ${p.level}\n\nاكتب واجهة مستخدم لعرض ملفك الكامل`,
      threadID, messageID
    );
  }

  // بدء التسجيل - الخطوة 1: طلب الاسم
  pendingReg.set(senderID, { step: 1, threadID });

  const regionList = Object.entries(REGIONS).map(([num, r]) =>
    `${num}. ${r.emoji} ${r.name} (${r.element})\n   └ ${r.desc}\n   └ ${r.statText}`
  ).join("\n\n");

  return api.sendMessage(
    `📢 مرحباً بك في نظام Global Solo Leveling!\n\n` +
    `الخطوة 1⃣: أرسل اسم اللاعب الذي تريده\n` +
    `(أي اسم تختاره، مثال: المحارب، ShadowKing، أبو خالد)\n\n` +
    `━━━━━━━━━━━━━━━\n` +
    `⚠️ لا يمكن تغيير الاسم أو الإقليم لاحقاً`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  if (!event.body || !event.body.trim()) return;
  const { threadID, senderID, body } = event;
  const text = body.trim();

  if (!pendingReg.has(senderID)) return;
  const state = pendingReg.get(senderID);
  if (state.threadID !== threadID) return;

  // الخطوة 1: استقبال الاسم
  if (state.step === 1) {
    if (text.length < 2 || text.length > 30) {
      return api.sendMessage("❌ الاسم يجب أن يكون بين 2 و30 حرف، حاول مجدداً:", threadID);
    }
    if (/^[0-9]+$/.test(text)) {
      return api.sendMessage("❌ الاسم لا يمكن أن يكون أرقاماً فقط، أدخل اسماً صحيحاً:", threadID);
    }

    state.step = 2;
    state.name = text;
    pendingReg.set(senderID, state);

    const regionList = Object.entries(REGIONS).map(([num, r]) =>
      `${num}️⃣ ${r.emoji} ${r.name} (${r.element})\n    ⚡ ${r.statText}\n    🔮 تعويذة البداية: ${r.startSpells.join("، ")}\n    🛡 المهارة السلبية: ${r.passive.name}`
    ).join("\n\n");

    return api.sendMessage(
      `✅ الاسم: "${text}"\n\n` +
      `الخطوة 2⃣: اختر إقليمك (أرسل الرقم من 1 إلى 6)\n\n` +
      `🌍 الأقاليم المتوفرة:\n━━━━━━━━━━━━━━━\n` +
      `${regionList}\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `⚠️ لا يمكن تغيير الإقليم لاحقاً — اختر بعناية!`,
      threadID
    );
  }

  // الخطوة 2: استقبال رقم الإقليم
  if (state.step === 2) {
    const regionNum = text.trim();
    const region = REGIONS[regionNum];
    if (!region) {
      return api.sendMessage("❌ أرسل رقماً من 1 إلى 6 لاختيار الإقليم:", threadID);
    }

    pendingReg.delete(senderID);

    const all = loadPlayers();
    let pData = all[senderID] || {
      name: state.name, level: 1, exp: 0, rank: "E",
      maxHP: 120, maxStamina: 100,
      atk: 18, def: 6, coins: 0, reputation: 0,
      wins: 0, losses: 0, kills: 0, skillPoints: 0,
      spells: [], pathPerks: [], pathTiers: [],
      skillCooldowns: {}, style: { attack: 0, defend: 0, skill: 0, flee: 0 }
    };

    pData.registered = true;
    pData.playerName = state.name;
    pData.region = region.name;
    pData.regionId = region.id;
    pData = applyRegionBonuses(pData, region);
    pData.hp = pData.maxHP;
    pData.stamina = pData.maxStamina;

    all[senderID] = pData;
    savePlayers(all);

    return api.sendMessage(
      `🎉 تم التسجيل بنجاح!\n\n` +
      `👤 الاسم: ${state.name}\n` +
      `${region.emoji} الإقليم: ${region.name} (${region.element})\n` +
      `━━━━━━━━━━━━━━━\n` +
      `📊 إحصاءاتك الأولية:\n` +
      `❤️ HP: ${pData.maxHP}\n` +
      `⚔️ هجوم: ${pData.atk}\n` +
      `🛡 دفاع: ${pData.def}\n` +
      `⚡ طاقة: ${pData.maxStamina}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `🔮 تعويذة مفتوحة: ${region.startSpells.join("، ")}\n` +
      `🛡 مهارتك السلبية: ${region.passive.name}\n` +
      `   └ ${region.passive.desc}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `👑 حظاً موفقاً أيها الصياد!\n` +
      `اكتب: قتال لبدء مسيرتك\nأو: شجرة لعرض شجرة التطوير`,
      threadID
    );
  }
};
