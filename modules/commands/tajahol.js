const fs = require("fs");
const path = require("path");
const configPath = path.join(process.cwd(), "config.json");

module.exports.config = {
  name: "تجاهل",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "تجاهل أي شخص غير أدمن البوت بشكل صامت",
  commandCategory: "أوامر",
  usages: "تجاهل | تجاهل توقف",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const adminIDs = config.ADMINBOT || [];

  if (!adminIDs.includes(String(senderID))) return;

  if (args[0] === "توقف") {
    config.ignoreNonAdmin = false;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
    global.config.ignoreNonAdmin = false;
    return api.sendMessage(
      "✅ تم الإيقاف\nالبوت يرد على الجميع الآن",
      threadID, messageID
    );
  }

  config.ignoreNonAdmin = true;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
  global.config.ignoreNonAdmin = true;
  return api.sendMessage(
    "🔕 تم التفعيل\nالبوت يتجاهل أي شخص غير أدمن البوت بشكل صامت\n\nللإيقاف: تجاهل توقف",
    threadID, messageID
  );
};
