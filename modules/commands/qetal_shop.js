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
//              قاعدة بيانات المتجر
// ═══════════════════════════════════════
const RARITY_ICON = { common: "⚪", uncommon: "🟢", rare: "🔵", epic: "🟣", legendary: "🟡", mythical: "🔴" };

const SHOP_ITEMS = {
  // ── أسلحة ──
  iron_sword:      { name: "السيف الحديدي ⚔️",   type: "weapon", rarity: "common",    price: 200,  bonusAtk: 5,  desc: "سيف بسيط للمبتدئين" },
  steel_blade:     { name: "النصل الفولاذي ⚔️",   type: "weapon", rarity: "uncommon",  price: 500,  bonusAtk: 12, desc: "نصل متين يخترق الدروع الخفيفة" },
  shadow_edge:     { name: "حافة الظل 🗡",        type: "weapon", rarity: "rare",      price: 1500, bonusAtk: 20, bonusCrit: 0.10, desc: "شفرة مصنوعة من ظلام خالص" },
  dark_blade:      { name: "النصل المظلم ⚔️",     type: "weapon", rarity: "epic",      price: 3000, bonusAtk: 30, armorPen: 0.20, desc: "يخترق 20% من دفاع العدو" },
  monarchs_blade:  { name: "نصل الملك 👑",         type: "weapon", rarity: "legendary", price: 8000, bonusAtk: 50, bonusCrit: 0.20, desc: "سلاح الملوك المنسيين" },
  void_reaper:     { name: "حصاد الفراغ 🌑",       type: "weapon", rarity: "mythical",  price: 20000,bonusAtk: 80, bonusCrit: 0.30, armorPen: 0.30, desc: "سلاح أسطوري — قليلون من رأوه" },

  // ── دروع ──
  leather_armor:   { name: "درع الجلد 🛡",         type: "armor",  rarity: "common",    price: 150,  bonusDef: 5,  desc: "حماية بسيطة للمبتدئين" },
  iron_armor:      { name: "درع الحديد 🛡",         type: "armor",  rarity: "uncommon",  price: 400,  bonusDef: 12, desc: "يصمد أمام الضربات المتوسطة" },
  shadow_cloak:    { name: "عباءة الظل 🌑",         type: "armor",  rarity: "rare",      price: 1200, bonusDef: 18, bonusDodge: 0.10, desc: "10% احتمالية تفادي الضربة" },
  dragon_scale:    { name: "حراشف التنين 🐉",        type: "armor",  rarity: "epic",      price: 5000, bonusDef: 30, bonusHP: 50, desc: "+50 HP و+30 دفاع" },
  monarchs_guard:  { name: "درع الملك 👑",           type: "armor",  rarity: "legendary", price: 12000,bonusDef: 50, bonusHP: 100, bonusDodge: 0.15, desc: "حماية مطلقة للملوك" },
  void_mantle:     { name: "عباءة الفراغ 🌑",        type: "armor",  rarity: "mythical",  price: 25000,bonusDef: 80, bonusHP: 200, bonusDodge: 0.25, desc: "أسطورية — تحمي من كل شيء تقريباً" },

  // ── جرعات ──
  hp_potion_s:     { name: "جرعة HP صغيرة 💚",     type: "potion", rarity: "common",    price: 80,   healHP: 40,   desc: "تستعيد 40 HP في المعركة", slot: "hp" },
  hp_potion_l:     { name: "جرعة HP كبيرة 💚",      type: "potion", rarity: "uncommon",  price: 200,  healHP: 100,  desc: "تستعيد 100 HP في المعركة", slot: "hp_large" },
  stamina_potion:  { name: "جرعة طاقة ⚡",           type: "potion", rarity: "common",    price: 100,  healStamina: 50, desc: "تستعيد 50 طاقة في المعركة", slot: "stamina" },
  elixir:          { name: "إكسير النجاة ✨",         type: "potion", rarity: "rare",      price: 350,  healHP: 80,   healStamina: 50, desc: "يستعيد HP وطاقة معاً", slot: "elixir" },
  divine_elixir:   { name: "إكسير إلهي 🌟",          type: "potion", rarity: "legendary", price: 2000, healHP: 300,  healStamina: 150, full: true, desc: "يستعيد كل HP وطاقة بالكامل", slot: "divine" },

  // ── تعاويذ ──
  spell_fire:      { name: "تعويذة النار 🔥",        type: "spell",  rarity: "rare",      price: 800,  spellId: "نار",    desc: "تفتح مهارة نار (55 ضرر + حرق)" },
  spell_thunder:   { name: "تعويذة الصاعقة ⚡",      type: "spell",  rarity: "epic",      price: 1500, spellId: "صاعقة", desc: "تفتح مهارة صاعقة (65 ضرر + ذهول)" },
  spell_ice:       { name: "تعويذة الجليد 🧊",        type: "spell",  rarity: "rare",      price: 700,  spellId: "جليد",   desc: "تفتح مهارة جليد (45 ضرر + إبطاء)" },
  spell_void:      { name: "تعويذة الفراغ 🌑",        type: "spell",  rarity: "mythical",  price: 15000,spellId: "فراغ",   desc: "تفتح مهارة فراغ (100 ضرر، يتجاهل الدفاع)" },

  // ── بوستات ──
  xp_boost:        { name: "مضاعف XP 📈",            type: "boost",  rarity: "uncommon",  price: 300,  boostType: "xp",   boostMult: 2, boostDuration: 10, desc: "×2 XP لـ 10 معارك" },
  gold_boost:      { name: "مضاعف ذهب 💰",            type: "boost",  rarity: "uncommon",  price: 300,  boostType: "gold", boostMult: 2, boostDuration: 10, desc: "×2 ذهب لـ 10 معارك" },
};

// ── ترقية العناصر ──
const UPGRADE_PATHS = {
  iron_sword:   { next: "steel_blade",   cost: 300,  desc: "ترقية إلى النصل الفولاذي" },
  steel_blade:  { next: "shadow_edge",   cost: 800,  desc: "ترقية إلى حافة الظل" },
  shadow_edge:  { next: "dark_blade",    cost: 1200, desc: "ترقية إلى النصل المظلم" },
  dark_blade:   { next: "monarchs_blade",cost: 4000, desc: "ترقية إلى نصل الملك" },
  leather_armor:{ next: "iron_armor",    cost: 200,  desc: "ترقية إلى درع الحديد" },
  iron_armor:   { next: "shadow_cloak",  cost: 700,  desc: "ترقية إلى عباءة الظل" },
  shadow_cloak: { next: "dragon_scale",  cost: 3000, desc: "ترقية إلى حراشف التنين" },
  dragon_scale: { next: "monarchs_guard",cost: 6000, desc: "ترقية إلى درع الملك" },
};

function itemLine(id, item, equipped) {
  const eq = equipped === id ? " ✅ مجهّز" : "";
  const r = RARITY_ICON[item.rarity] || "⚪";
  return `${r} ${item.name}${eq}\n   💰 ${item.price} ذهب | ${item.desc}`;
}

function showCategory(type, pData) {
  const items = Object.entries(SHOP_ITEMS).filter(([, v]) => v.type === type);
  const inv = pData.inventory || [];
  const lines = items.map(([id, item]) => {
    const owned = inv.includes(id) ? " 📦 مملوك" : "";
    const r = RARITY_ICON[item.rarity] || "⚪";
    return `${r} ${item.name}${owned}\n   💰 ${item.price} ذهب | ${item.desc}\n   🆔 الكود: ${id}`;
  });
  return lines.join("\n\n");
}

const CATEGORY_NAMES = { weapon: "أسلحة ⚔️", armor: "دروع 🛡", potion: "جرعات 💚", spell: "تعاويذ 🔮", boost: "بوستات 📈" };

// ═══════════════════════════════════════
module.exports.config = {
  name: "متجر",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "متجر اللعبة — أسلحة، دروع، جرعات، تعاويذ",
  commandCategory: "ألعاب",
  usages: "متجر | متجر أسلحة | متجر دروع | متجر جرعات | متجر تعاويذ | متجر شراء [كود] | متجر تجهيز [كود] | متجر ترقية [كود]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // ── فحص التسجيل ──
  const _regAll = loadPlayers();
  if (!_regAll[senderID] || !_regAll[senderID].registered) {
    return api.sendMessage("❌ يجب التسجيل أولاً!\nاكتب: تسجيل", threadID, messageID);
  }
  const sub = args[0] || "";

  const allP = loadPlayers();
  const pData = allP[senderID];
  if (!pData) return api.sendMessage("❌ ما عندك حساب! العب قتال أولاً لإنشاء حسابك", threadID, messageID);

  const coins = pData.coins || 0;
  const inv = pData.inventory || [];

  // ── القائمة الرئيسية ──
  if (!sub) {
    return api.sendMessage(
      `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n` +
      `➢ 𝑺𝑯𝑶𝑷 𝑺𝒀𝑺𝑻𝑬𝑴\n` +
      `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n\n` +
      `💰 رصيدك: ${coins} ذهب\n` +
      `📦 مخزونك: ${inv.length} عنصر\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `⚔️ متجر أسلحة\n🛡 متجر دروع\n💚 متجر جرعات\n🔮 متجر تعاويذ\n📈 متجر بوستات\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `شراء: متجر شراء [كود العنصر]\n` +
      `تجهيز: متجر تجهيز [كود العنصر]\n` +
      `ترقية: متجر ترقية [كود العنصر]\n` +
      `مخزون: متجر مخزون`,
      threadID, messageID
    );
  }

  // ── مخزون اللاعب ──
  if (sub === "مخزون" || sub === "حقيبة") {
    if (inv.length === 0) return api.sendMessage("📦 مخزونك فارغ! تسوق من المتجر", threadID, messageID);
    const lines = inv.map(id => {
      const item = SHOP_ITEMS[id];
      if (!item) return null;
      const equipped = (pData.weapon === id || pData.armor === id) ? " ✅ مجهّز" : "";
      return `${RARITY_ICON[item.rarity]} ${item.name}${equipped} | ${id}`;
    }).filter(Boolean);
    return api.sendMessage(
      `📦 مخزونك (${inv.length} عنصر)\n💰 ذهب: ${coins}\n━━━━━━━━━━━━━━━━━\n` + lines.join("\n"),
      threadID, messageID
    );
  }

  // ── عرض فئة ──
  const catMap = { أسلحة: "weapon", دروع: "armor", جرعات: "potion", تعاويذ: "spell", بوستات: "boost" };
  if (catMap[sub]) {
    const cat = catMap[sub];
    return api.sendMessage(
      `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n➢ ${CATEGORY_NAMES[cat]}\n💰 رصيدك: ${coins} ذهب\n━━━━━━━━━━━━━━━━━\n\n` +
      showCategory(cat, pData),
      threadID, messageID
    );
  }

  // ── شراء ──
  if (sub === "شراء") {
    const itemId = args[1];
    if (!itemId) return api.sendMessage("❌ اكتب كود العنصر\nمثال: متجر شراء iron_sword", threadID, messageID);
    const item = SHOP_ITEMS[itemId];
    if (!item) return api.sendMessage(`❌ عنصر غير موجود: ${itemId}\nتصفح المتجر لمعرفة الأكواد`, threadID, messageID);

    // جرعات — قابلة للشراء عدة مرات
    if (item.type === "potion") {
      if (coins < item.price) return api.sendMessage(`❌ ذهب غير كافٍ! السعر: ${item.price} | رصيدك: ${coins}`, threadID, messageID);
      pData.coins = coins - item.price;
      pData.potions = pData.potions || {};
      const slot = item.slot || "hp";
      pData.potions[slot] = (pData.potions[slot] || 0) + 1;
      if (!inv.includes(itemId + "_owned")) pData.inventory = [...inv, itemId + "_owned"];
      savePlayer(senderID, pData);
      return api.sendMessage(
        `✅ اشتريت: ${item.name}\n💰 ذهب متبقي: ${pData.coins}\n${item.slot}: ×${pData.potions[slot]}`,
        threadID, messageID
      );
    }

    // بوستات
    if (item.type === "boost") {
      if (coins < item.price) return api.sendMessage(`❌ ذهب غير كافٍ! السعر: ${item.price} | رصيدك: ${coins}`, threadID, messageID);
      pData.coins = coins - item.price;
      pData.boosts = pData.boosts || {};
      pData.boosts[item.boostType] = { mult: item.boostMult, battles: item.boostDuration };
      savePlayer(senderID, pData);
      return api.sendMessage(
        `✅ فعّلت: ${item.name}\n${item.desc}\n💰 ذهب متبقي: ${pData.coins}`,
        threadID, messageID
      );
    }

    // تعاويذ
    if (item.type === "spell") {
      if (inv.includes(itemId)) return api.sendMessage("✅ تملك هذه التعويذة بالفعل!", threadID, messageID);
      if (coins < item.price) return api.sendMessage(`❌ ذهب غير كافٍ! السعر: ${item.price} | رصيدك: ${coins}`, threadID, messageID);
      pData.coins = coins - item.price;
      pData.inventory = [...inv, itemId];
      pData.spells = [...(pData.spells || []), item.spellId];
      savePlayer(senderID, pData);
      return api.sendMessage(
        `✅ فتحت تعويذة: ${item.name}\n🔮 مهارة جديدة: ${item.spellId}\nاستخدمها في القتال بكتابة اسمها`,
        threadID, messageID
      );
    }

    // أسلحة / دروع
    if (inv.includes(itemId)) return api.sendMessage("📦 تملك هذا العنصر بالفعل في مخزونك!", threadID, messageID);
    if (coins < item.price) return api.sendMessage(`❌ ذهب غير كافٍ!\nالسعر: ${item.price} 💰 | رصيدك: ${coins} 💰`, threadID, messageID);
    pData.coins = coins - item.price;
    pData.inventory = [...inv, itemId];
    savePlayer(senderID, pData);
    return api.sendMessage(
      `✅ اشتريت: ${RARITY_ICON[item.rarity]} ${item.name}\n${item.desc}\n💰 ذهب متبقي: ${pData.coins}\n\nلتجهيزه: متجر تجهيز ${itemId}`,
      threadID, messageID
    );
  }

  // ── تجهيز ──
  if (sub === "تجهيز") {
    const itemId = args[1];
    if (!itemId) return api.sendMessage("❌ اكتب كود العنصر\nمثال: متجر تجهيز steel_blade", threadID, messageID);
    const item = SHOP_ITEMS[itemId];
    if (!item) return api.sendMessage(`❌ عنصر غير موجود`, threadID, messageID);
    if (!inv.includes(itemId)) return api.sendMessage("❌ هذا العنصر غير موجود في مخزونك", threadID, messageID);
    if (item.type !== "weapon" && item.type !== "armor") return api.sendMessage("❌ هذا العنصر غير قابل للتجهيز", threadID, messageID);
    if (item.type === "weapon") pData.weapon = itemId;
    if (item.type === "armor") pData.armor = itemId;
    savePlayer(senderID, pData);

    const bonuses = [];
    if (item.bonusAtk)   bonuses.push(`⚔️ +${item.bonusAtk} هجوم`);
    if (item.bonusDef)   bonuses.push(`🛡 +${item.bonusDef} دفاع`);
    if (item.bonusHP)    bonuses.push(`❤️ +${item.bonusHP} HP`);
    if (item.bonusCrit)  bonuses.push(`💥 +${(item.bonusCrit*100).toFixed(0)}% حرجي`);
    if (item.bonusDodge) bonuses.push(`💨 +${(item.bonusDodge*100).toFixed(0)}% تفادي`);
    return api.sendMessage(
      `✅ جهّزت: ${RARITY_ICON[item.rarity]} ${item.name}\n\nإضافات:\n${bonuses.join("\n")}`,
      threadID, messageID
    );
  }

  // ── ترقية ──
  if (sub === "ترقية") {
    const itemId = args[1];
    if (!itemId) return api.sendMessage("❌ اكتب كود العنصر\nمثال: متجر ترقية iron_sword", threadID, messageID);
    const upgrade = UPGRADE_PATHS[itemId];
    if (!upgrade) return api.sendMessage("❌ هذا العنصر لا يمكن ترقيته أو وصل للحد الأقصى", threadID, messageID);
    if (!inv.includes(itemId)) return api.sendMessage("❌ هذا العنصر غير موجود في مخزونك", threadID, messageID);
    if (coins < upgrade.cost) return api.sendMessage(`❌ ذهب غير كافٍ! تكلفة الترقية: ${upgrade.cost} | رصيدك: ${coins}`, threadID, messageID);

    pData.coins -= upgrade.cost;
    pData.inventory = pData.inventory.filter(i => i !== itemId);
    pData.inventory.push(upgrade.next);
    if (pData.weapon === itemId) pData.weapon = upgrade.next;
    if (pData.armor  === itemId) pData.armor  = upgrade.next;

    const newItem = SHOP_ITEMS[upgrade.next];
    savePlayer(senderID, pData);
    return api.sendMessage(
      `🔧 تمت الترقية!\n${SHOP_ITEMS[itemId]?.name} ➜ ${RARITY_ICON[newItem.rarity]} ${newItem.name}\n${upgrade.desc}\n💰 ذهب متبقي: ${pData.coins}`,
      threadID, messageID
    );
  }

  return api.sendMessage("❓ أمر غير معروف\nاكتب: متجر — لعرض القائمة الكاملة", threadID, messageID);
};
