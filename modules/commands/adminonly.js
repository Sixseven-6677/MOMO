const fs = require("fs");
const path = require("path");
const dataPath = path.join(__dirname, "cache/data.json");
const configPath = path.join(process.cwd(), "config.json");

module.exports.config = {
  name: "ادمن",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "تحكم بصلاحيات البوت وقائمة الأدمن",
  commandCategory: "أوامر",
  usages: "ادمن فقط | ادمن الكل | ادمن تحديث [ID] | ادمن ازالة [ID]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const adminIDs = config.ADMINBOT || [];

  if (!adminIDs.includes(String(senderID))) {
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);
  }

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
    if (adminIDs.includes(newID)) {
      return api.sendMessage("⚠️ هذا الـ ID موجود بالفعل في قائمة الأدمن", threadID, messageID);
    }
    config.ADMINBOT.push(newID);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
    global.config.ADMINBOT = config.ADMINBOT;
    return api.sendMessage(
      `✅ تم إضافة الأدمن الجديد\nID: ${newID}\nعدد الأدمن الآن: ${config.ADMINBOT.length}`,
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
    if (index < 0 || index >= adminIDs.length) {
      return api.sendMessage(
        `❌ الرقم غير صحيح، القائمة تحتوي على ${adminIDs.length} أدمن`,
        threadID, messageID
      );
    }

    const removeID = adminIDs[index];
    if (removeID === String(senderID)) {
      return api.sendMessage("❌ لا تقدر تزيل نفسك من الأدمن", threadID, messageID);
    }

    config.ADMINBOT = config.ADMINBOT.filter(id => id !== removeID);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
    global.config.ADMINBOT = config.ADMINBOT;

    let name = removeID;
    try {
      const info = await api.getUserInfo(removeID);
      name = info[removeID]?.name || removeID;
    } catch (e) {}

    return api.sendMessage(
      `✅ تم إزالة الأدمن رقم ${index + 1}\nالاسم: ${name}\nID: ${removeID}\nعدد الأدمن الآن: ${config.ADMINBOT.length}`,
      threadID, messageID
    );
  }

  return api.sendMessage(
    `:𝖠𝖽𝗆𝗂𝗇 𝖼𝗈𝗆𝗆𝖺𝗇𝖽𝗌-\n` +
    `-ادمن فقط.، البوت يرد على الادمن فقط\n` +
    `-ادمن الكل.، البوت يرد على الجميع\n` +
    `ادمن تحديث 〔𝖨𝖣〕اضافة ادمن جديد\n` +
    `-ادمن ازالة 〔𝖨𝖣〕ازالة ادمن`,
    threadID, messageID
  );
};
