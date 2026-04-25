const helper = require("./data/approveAdd_helper.js");

module.exports.config = {
  name: "فتح",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "إيقاف قفل الإضافة (السماح للجميع بإضافة أعضاء)",
  commandCategory: "أوامر",
  usages: "فتح الاضافة",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const sub = (args[0] || "").trim();
  if (sub === "الاضافة" || sub === "الإضافة") {
    return helper.setEnabled(api, event, false);
  }
  return api.sendMessage("الاستخدام: فتح الاضافة", event.threadID, event.messageID);
};
