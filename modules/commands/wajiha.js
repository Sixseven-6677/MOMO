const fs   = require("fs");
const path = require("path");
const dataDir = path.join(process.cwd(), "Horizon_Database");
const playersPath = path.join(dataDir, "qetal_players.json");

function loadPlayers() {
  try {
    if (!fs.existsSync(playersPath)) return {};
    return JSON.parse(fs.readFileSync(playersPath, "utf8"));
  } catch { return {}; }
}

const REGION_INFO = {
  kohen:    { name:"كوهين",     emoji:"🔥", element:"النار"   },
  jisao:    { name:"جيساو",     emoji:"🌊", element:"الماء"   },
  marlin:   { name:"مارلين",    emoji:"🌪️", element:"الرياح"  },
  bastard:  { name:"باستارد",   emoji:"🌑", element:"الظلام"  },
  shinsako: { name:"الشينساكو", emoji:"🪨", element:"الصخر"   },
  zourd:    { name:"الزورد",    emoji:"✨", element:"النور"   }
};

const PASSIVE_DESC = {
  burn_passive:   "🔥 جمر — 20% احتمال إحراق الخصم",
  regen_passive:  "🌊 تيار الحياة — +8 HP/جولة",
  dodge_passive:  "🌪️ عين العاصفة — 15% تفادي تلقائي",
  poison_passive: "🌑 لدغة الظلام — 25% سم تلقائي",
  rock_passive:   "🪨 جلد الصخر — تخفيف 15% ضرر",
  light_passive:  "✨ هالة النور — مهارات -15% طاقة"
};

const RANK_ICON = { E:"⬜", D:"🟩", C:"🟦", B:"🟪", A:"🟧", S:"🟥" };
const EXP_TABLE = (lv) => Math.floor(100 * Math.pow(1.3, lv - 1));

function expBar(exp, needed, size = 10) {
  const filled = Math.min(size, Math.round((exp / needed) * size));
  return "█".repeat(filled) + "░".repeat(size - filled);
}

const WEAPON_NAMES = {
  iron_sword:"السيف الحديدي ⚔️", steel_blade:"النصل الفولاذي ⚔️",
  shadow_edge:"حافة الظل 🗡", dark_blade:"النصل المظلم ⚔️",
  monarchs_blade:"نصل الملك 👑", void_reaper:"حصاد الفراغ 🌑"
};
const ARMOR_NAMES = {
  leather_armor:"درع الجلد 🛡", iron_armor:"درع الحديد 🛡",
  shadow_cloak:"عباءة الظل 🌑", dragon_scale:"قشرة التنين 🐉",
  monarchs_guard:"حرس الملك 👑", void_mantle:"عباءة الفراغ 🌑"
};

module.exports.config = {
  name: "واجهة",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "عرض ملفك الشخصي الكامل في نظام Global",
  commandCategory: "نظام",
  usages: "واجهة مستخدم",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const all = loadPlayers();
  const p   = all[senderID];

  // لاعب غير موجود إطلاقاً
  if (!p) {
    return api.sendMessage(
      `❌ لم تسجّل بعد في نظام Global!\n\nاكتب: تسجيل\nلبدء مسيرتك كصياد 👑`,
      threadID, messageID
    );
  }

  // لاعب موجود لكن قبل نظام التسجيل (registered غير موجود)
  if (!p.registered) {
    return api.sendMessage(
      `⚠️ حسابك موجود لكنك لم تُسجّل في النظام الجديد بعد!\n\nاكتب: تسجيل\nلاختيار اسمك وإقليمك والحصول على مكافآت الإقليم 🏆`,
      threadID, messageID
    );
  }

  const region    = REGION_INFO[p.regionId] || { name: p.region || "؟", emoji:"🌍", element:"؟" };
  const rankIcon  = RANK_ICON[p.rank] || "⬜";
  const expNeeded = EXP_TABLE(p.level || 1);
  const bar       = expBar(p.exp || 0, expNeeded);
  const passive   = PASSIVE_DESC[p.regionPassive] || "—";
  const weapon    = WEAPON_NAMES[p.weapon]  || "لا يوجد";
  const armor     = ARMOR_NAMES[p.armor]   || "لا يوجد";
  const spells    = (p.spells || []).join("، ") || "لا توجد";
  const wins      = p.wins   || 0;
  const losses    = p.losses || 0;
  const winRate   = (wins + losses > 0) ? Math.round((wins / (wins + losses)) * 100) : 0;

  const rTree  = (p.regionTiers || []).length;
  const pPath  = p.path ? `${p.path} (${(p.pathTiers||[]).length}/4)` : "لم يُختر";

  const msg =
    `╔══════════════════════╗\n` +
    `║  👤 ${p.playerName || p.name}\n` +
    `║  ${region.emoji} ${region.name} (${region.element})\n` +
    `╚══════════════════════╝\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `${rankIcon} الرتبة: ${p.rank || "E"}  |  Lv. ${p.level || 1}\n` +
    `📊 XP: [${bar}] ${p.exp || 0}/${expNeeded}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `❤️  HP:      ${p.maxHP || 120}\n` +
    `⚔️  هجوم:    ${p.atk  || 18}\n` +
    `🛡  دفاع:    ${p.def  || 6}\n` +
    `⚡  طاقة:    ${p.maxStamina || 100}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `🗡  سلاح:    ${weapon}\n` +
    `🧥  درع:     ${armor}\n` +
    `🔮  تعاويذ:  ${spells}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `🌿  شجرة الإقليم: ${rTree}/5 مفتوح\n` +
    `⚔️  فئة التطوير:  ${pPath}\n` +
    `🛡  المهارة السلبية:\n    └ ${passive}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `🪙  ذهب:       ${(p.coins      || 0).toLocaleString()}\n` +
    `⭐  هيبة:      ${p.reputation  || 0}\n` +
    `🔷  نقاط مهارة: ${p.skillPoints || 0}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `🏆 ${wins} انتصار  |  💔 ${losses} خسارة  |  نسبة الفوز ${winRate}%`;

  return api.sendMessage(msg, threadID, messageID);
};
