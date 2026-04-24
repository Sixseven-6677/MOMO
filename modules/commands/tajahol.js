const fs = require("fs");
const path = require("path");
const configPath = path.join(process.cwd(), "config.json");

module.exports.config = {
  name: "تجاهل",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "تجاهل غير الأدمن أو صمت كلي للجميع",
  commandCategory: "أوامر",
  usages: "تجاهل | تجاهل توقف | تجاهل كلي | تجاهل كلي توقف",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const adminIDs = config.ADMINBOT || [];

  if (!adminIDs.includes(String(senderID))) return;

  if (args[0] === "كلي") {
    if (args[1] === "توقف") {
      config.totalSilence = false;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
      global.config.totalSilence = false;
      return api.sendMessage(
        "✅ تم إيقاف الصمت الكلي\nالبوت يرد الآن بشكل طبيعي",
        threadID, messageID
      );
    }
    config.totalSilence = true;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
    global.config.totalSilence = true;
    return api.sendMessage(
      "🔇 تم تفعيل الصمت الكلي\nالبوت لن يرد على أي شخص حتى أدمن البوت\n\nللإيقاف: تجاهل كلي توقف",
      threadID, messageID
    );
  }

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
