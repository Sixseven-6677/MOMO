const fs = require("fs");
const path = require("path");
const dataDir = path.join(__dirname, "data");
const playersPath = path.join(dataDir, "qetal_players.json");

function loadPlayers() {
  try { if (!fs.existsSync(playersPath)) return {}; return JSON.parse(fs.readFileSync(playersPath, "utf8")); } catch { return {}; }
}
function savePlayers(d) {
  try { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(playersPath, JSON.stringify(d, null, 2)); } catch {}
}
function savePlayer(id, data) { const all = loadPlayers(); all[id] = data; savePlayers(all); }

// ═══════════════════════════════════════
//             مسارات المهارات
// ═══════════════════════════════════════
const PATHS = {
  محارب: {
    icon: "⚔️", nameEn: "Warrior",
    desc: "قوة هجوم هائلة وصلابة لا تُكسر",
    tiers: [
      { id: "warrior_1", cost: 1, name: "قوة المحارب", desc: "+10% هجوم دائم", stat: "atk", mult: 1.10 },
      { id: "warrior_2", cost: 2, name: "صلابة الجسد", desc: "+15% HP الأقصى دائم", stat: "maxHP", mult: 1.15 },
      { id: "warrior_3", cost: 3, name: "غضب الحرب",   desc: "مهارة: عند HP < 30% يتضاعف هجومك تلقائياً", perk: "warrior_rage" },
      { id: "warrior_4", cost: 5, name: "إرادة الحديد", desc: "مرة لكل معركة: تبقى بـ 1 HP بدل الموت", perk: "iron_will" },
    ]
  },
  اغتيال: {
    icon: "🗡", nameEn: "Assassin",
    desc: "سرعة وضربات حرجة تُنهي المعارك في ثوانٍ",
    tiers: [
      { id: "assassin_1", cost: 1, name: "حافة الظل",   desc: "+15% احتمالية ضربة حرجة دائم", perk: "crit_boost" },
      { id: "assassin_2", cost: 2, name: "سم الشفرة",   desc: "مهارة: تسميم (10 ضرر/جولة لـ 4 جولات)", perk: "poison_skill" },
      { id: "assassin_3", cost: 3, name: "الاختفاء",    desc: "مهارة: هروب مضمون + هجوم مضاد فوري", perk: "vanish_skill" },
      { id: "assassin_4", cost: 5, name: "الاغتيال المطلق", desc: "جميع ضرباتك تتجاهل 30% من دفاع العدو", perk: "armor_pierce" },
    ]
  },
  ساحر: {
    icon: "🔮", nameEn: "Mage",
    desc: "سحر مدمر واستعادة طاقة لا حدود لها",
    tiers: [
      { id: "mage_1", cost: 1, name: "كرة النار",   desc: "مهارة: نار (55 ضرر + حرق 8/جولة × 3)", perk: "fire_skill" },
      { id: "mage_2", cost: 2, name: "تأمل عميق",  desc: "+20% طاقة قصوى دائم", stat: "maxStamina", mult: 1.20 },
      { id: "mage_3", cost: 3, name: "درع السحر",  desc: "مهارة: سحري (يمتص أول 100 ضرر)", perk: "magic_shield" },
      { id: "mage_4", cost: 5, name: "اندفاع السحر", desc: "مهارة: سحر (جميع المهارات بـ 50% طاقة لـ 3 جولات)", perk: "mana_surge" },
    ]
  },
  تكتيكي: {
    icon: "🎯", nameEn: "Tactician",
    desc: "التخطيط والتحليل يُسقطان حتى أقوى الأعداء",
    tiers: [
      { id: "tactician_1", cost: 1, name: "توقع الضربة", desc: "مهارة: توقع (تتفادى الضربة القادمة تماماً)", perk: "predict_skill" },
      { id: "tactician_2", cost: 2, name: "رد الفعل",    desc: "عند الدفاع: ترد 25% من الضرر للعدو", perk: "counter_perk" },
      { id: "tactician_3", cost: 3, name: "تكتيك متقدم", desc: "جميع Cooldowns تُخفَّض بـ 1 إضافي", perk: "cd_reduce" },
      { id: "tactician_4", cost: 5, name: "تخطيط ماكر",  desc: "مهارة: تخطيط (×2 ضرر للجولتين القادمتين)", perk: "plan_skill" },
    ]
  }
};

function drawTree(pData) {
  const pathKey = pData.path;
  const pathData = PATHS[pathKey];
  const unlockedPerks = pData.pathPerks || [];
  const unlockedTierIds = pData.pathTiers || [];

  let lines = [];
  lines.push(`⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁`);
  lines.push(`➢ 𝑺𝑲𝑰𝑳𝑳 𝑻𝑹𝑬𝑬 — ${pathData.icon} ${pathKey}`);
  lines.push(`⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁`);
  lines.push(`🔷 نقاط متاحة: ${pData.skillPoints || 0}`);
  lines.push(`━━━━━━━━━━━━━━━━━`);

  pathData.tiers.forEach((tier, i) => {
    const unlocked = unlockedTierIds.includes(tier.id);
    const canAfford = (pData.skillPoints || 0) >= tier.cost;
    const prevUnlocked = i === 0 || unlockedTierIds.includes(pathData.tiers[i - 1].id);
    const icon = unlocked ? "✅" : (prevUnlocked && canAfford ? "🔓" : "🔒");
    lines.push(`${icon} الدرجة ${i + 1}: ${tier.name} (${tier.cost} نقطة)`);
    lines.push(`   └ ${tier.desc}`);
  });

  lines.push(`━━━━━━━━━━━━━━━━━`);
  lines.push(`للترقية: شجرة ترقية [رقم الدرجة]`);
  return lines.join("\n");
}

// ═══════════════════════════════════════
module.exports.config = {
  name: "شجرة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "شجرة تطوير المهارات — اختر مسارك وطور قدراتك",
  commandCategory: "ألعاب",
  usages: "شجرة | شجرة مسار [محارب/اغتيال/ساحر/تكتيكي] | شجرة ترقية [رقم]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const sub = args[0] || "";

  const allP = loadPlayers();
  const pData = allP[senderID];
  if (!pData) return api.sendMessage("❌ ما عندك حساب! العب قتال أولاً لإنشاء حسابك", threadID, messageID);

  // ── بدون مسار ──
  if (!sub || sub === "عرض") {
    if (!pData.path) {
      const pathNames = Object.keys(PATHS);
      const lines = pathNames.map(k => {
        const p = PATHS[k];
        return `${p.icon} ${k} (${p.nameEn})\n   └ ${p.desc}`;
      });
      return api.sendMessage(
        `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n➢ 𝑺𝑲𝑰𝑳𝑳 𝑻𝑹𝑬𝑬\n⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n\n🔷 نقاط متاحة: ${pData.skillPoints || 0}\n\n📋 اختر مسارك:\n${lines.join("\n\n")}\n\nللاختيار: شجرة مسار [الاسم]`,
        threadID, messageID
      );
    }
    return api.sendMessage(drawTree(pData), threadID, messageID);
  }

  // ── اختيار مسار ──
  if (sub === "مسار") {
    if (pData.path) return api.sendMessage(`❌ مسارك محدد بالفعل: ${pData.path}\nلا يمكن تغيير المسار`, threadID, messageID);
    const chosen = args[1];
    if (!chosen || !PATHS[chosen]) {
      return api.sendMessage(`❌ اسم مسار غير صحيح\nالمسارات: ${Object.keys(PATHS).join(" | ")}`, threadID, messageID);
    }
    pData.path = chosen;
    pData.pathTiers = [];
    pData.pathPerks = [];
    pData.skillPoints = pData.skillPoints || 0;
    savePlayer(senderID, pData);
    return api.sendMessage(
      `🎉 اخترت مسار ${PATHS[chosen].icon} ${chosen}!\n\n${PATHS[chosen].desc}\n\nالآن طور مهاراتك: شجرة ترقية [رقم الدرجة]\nنقاطك الحالية: ${pData.skillPoints}`,
      threadID, messageID
    );
  }

  // ── ترقية درجة ──
  if (sub === "ترقية") {
    if (!pData.path) return api.sendMessage("❌ اختر مسارك أولاً: شجرة مسار [الاسم]", threadID, messageID);
    const tierNum = parseInt(args[1]);
    if (isNaN(tierNum) || tierNum < 1 || tierNum > 4) return api.sendMessage("❌ رقم الدرجة من 1 إلى 4", threadID, messageID);

    const pathData = PATHS[pData.path];
    const tier = pathData.tiers[tierNum - 1];

    if ((pData.pathTiers || []).includes(tier.id))
      return api.sendMessage("✅ هذه الدرجة مفتوحة بالفعل!", threadID, messageID);

    if (tierNum > 1 && !(pData.pathTiers || []).includes(pathData.tiers[tierNum - 2].id))
      return api.sendMessage("❌ يجب فتح الدرجة السابقة أولاً", threadID, messageID);

    if ((pData.skillPoints || 0) < tier.cost)
      return api.sendMessage(`❌ نقاط غير كافية! تحتاج ${tier.cost} ولديك ${pData.skillPoints || 0}\nاحصل على نقاط بترقية المستوى في القتال`, threadID, messageID);

    pData.skillPoints -= tier.cost;
    pData.pathTiers = [...(pData.pathTiers || []), tier.id];

    // Apply stat bonuses
    if (tier.stat && tier.mult) {
      pData[tier.stat] = Math.floor((pData[tier.stat] || 100) * tier.mult);
    }
    // Apply perk
    if (tier.perk) {
      pData.pathPerks = [...(pData.pathPerks || []), tier.perk];
    }

    savePlayer(senderID, pData);
    return api.sendMessage(
      `🔓 تم فتح الدرجة ${tierNum}: ${tier.name}!\n\n✨ ${tier.desc}\n\n🔷 نقاط متبقية: ${pData.skillPoints}\n\nشجرة ← لعرض شجرتك`,
      threadID, messageID
    );
  }

  return api.sendMessage("❓ أمر غير معروف\nاستخدم: شجرة | شجرة مسار [اسم] | شجرة ترقية [رقم]", threadID, messageID);
};
