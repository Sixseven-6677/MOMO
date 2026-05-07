const fs = require("fs");
const path = require("path");
// مسار ملف حفظ الأدمن المضافين يدوياً (يبقى حتى بعد الإعادة)
const adminsDataPath = path.join(process.cwd(), "Horizon_Database/admins.json");
const configPath = path.join(process.cwd(), "config.json");

function loadExtraAdmins() {
  try {
    if (fs.existsSync(adminsDataPath)) {
      const data = JSON.parse(fs.readFileSync(adminsDataPath, "utf8"));
      return Array.isArray(data.extra) ? data.extra : [];
    }
  } catch (e) {}
  return [];
}

function saveExtraAdmins(list) {
  let data = {};
  try {
    if (fs.existsSync(adminsDataPath)) data = JSON.parse(fs.readFileSync(adminsDataPath, "utf8"));
  } catch (e) {}
  data.extra = list;
  fs.writeFileSync(adminsDataPath, JSON.stringify(data, null, 2), "utf8");
}

function getAllAdmins() {
  const base = global.config.ADMINBOT || [];
  const extra = loadExtraAdmins();
  return [...new Set([...base, ...extra])];
}

module.exports.config = {
  name: "ادمن",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "تحكم بصلاحيات البوت وقائمة الأدمن",
  commandCategory: "أوامر",
  usages: "ادمن فقط | ادمن الكل | ادمن تحديث [ID] | ادمن ازالة [ID]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const allAdmins = getAllAdmins();
  // دمج مع global.config.ADMINBOT في كل مرة
  global.config.ADMINBOT = allAdmins;

  if (!allAdmins.includes(String(senderID))) {
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);
  }

  const dataPath = path.join(__dirname, "cache/data.json");
  const subCmd = args[0];

  if (subCmd === "فقط") {
    let data = { adminbox: {} };
    if (fs.existsSync(dataPath)) {
      try { data = JSON.parse(fs.readFileSync(dataPath, "utf8")); } catch (e) {}
    }
    if (!data.adminbox) data.adminbox = {};
    data.adminbox[threadID] = true;
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 4));
    return api.sendMessage(
      "🔒 تم التفعيل\nالبوت يرد على أدمن البوت فقط في هذا الكروب\n\nللإلغاء: ادمن الكل",
      threadID, messageID
    );
  }

  if (subCmd === "الكل") {
    let data = { adminbox: {} };
    if (fs.existsSync(dataPath)) {
      try { data = JSON.parse(fs.readFileSync(dataPath, "utf8")); } catch (e) {}
    }
    if (!data.adminbox) data.adminbox = {};
    data.adminbox[threadID] = false;
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 4));
    return api.sendMessage(
      "✅ تم الإلغاء\nالآن الكل يقدر يستخدم البوت",
      threadID, messageID
    );
  }

  if (subCmd === "تحديث") {
    const newID = String(args[1] || "").trim();
    if (!newID || isNaN(newID)) {
      return api.sendMessage(
        "❌ اكتب ID الحساب بعد الأمر\nمثال: ادمن تحديث 1234567890",
        threadID, messageID
      );
    }
    if (allAdmins.includes(newID)) {
      return api.sendMessage("⚠️ هذا الـ ID موجود بالفعل في قائمة الأدمن", threadID, messageID);
    }

    const extra = loadExtraAdmins();
    extra.push(newID);
    saveExtraAdmins(extra);

    // تحديث فوري في الذاكرة
    global.config.ADMINBOT = getAllAdmins();

    return api.sendMessage(
      `✅ تم إضافة الأدمن الجديد\nID: ${newID}\nعدد الأدمن الآن: ${global.config.ADMINBOT.length}\n\n⚠️ الأدمن محفوظ بشكل دائم`,
      threadID, messageID
    );
  }

  if (subCmd === "ازالة") {
    const input = String(args[1] || "").trim();
    if (!input || isNaN(input)) {
      return api.sendMessage(
        "❌ اكتب رقم الأدمن من القائمة\nمثال: ادمن ازالة 1",
        threadID, messageID
      );
    }

    const index = parseInt(input) - 1;
    if (index < 0 || index >= allAdmins.length) {
      return api.sendMessage(
        `❌ الرقم غير صحيح، القائمة تحتوي على ${allAdmins.length} أدمن`,
        threadID, messageID
      );
    }

    const removeID = allAdmins[index];
    if (removeID === String(senderID)) {
      return api.sendMessage("❌ لا تقدر تزيل نفسك من الأدمن", threadID, messageID);
    }

    // إزالة من الـ extra فقط (الأدمن الأساسيين في config.json لا يمكن إزالتهم)
    const baseAdmins = global.config.ADMINBOT.filter(id =>
      !(loadExtraAdmins().includes(id))
    );
    if (baseAdmins.includes(removeID)) {
      return api.sendMessage(
        "❌ لا تقدر تزيل أدمن أساسي من config.json",
        threadID, messageID
      );
    }

    const extra = loadExtraAdmins().filter(id => id !== removeID);
    saveExtraAdmins(extra);
    global.config.ADMINBOT = getAllAdmins();

    let name = removeID;
    try {
      const info = await api.getUserInfo(removeID);
      name = info[removeID]?.name || removeID;
    } catch (e) {}

    return api.sendMessage(
      `✅ تم إزالة الأدمن\nالاسم: ${name}\nID: ${removeID}\nعدد الأدمن الآن: ${global.config.ADMINBOT.length}`,
      threadID, messageID
    );
  }

  return api.sendMessage(
    `📋 أوامر الأدمن:\n\n` +
    `ادمن فقط ← البوت يرد على الأدمن فقط\n` +
    `ادمن الكل ← البوت يرد على الجميع\n` +
    `ادمن تحديث [ID] ← إضافة أدمن جديد (يُحفظ)\n` +
    `ادمن ازالة [رقم] ← إزالة أدمن من القائمة`,
    threadID, messageID
  );
};
