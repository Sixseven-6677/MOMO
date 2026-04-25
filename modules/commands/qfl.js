const helper = require("./data/approveAdd_helper.js");

module.exports.config = {
  name: "قفل",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "تفعيل قفل الإضافة (يجب موافقة الأدمن قبل دخول أي شخص يضاف للقروب)",
  commandCategory: "أوامر",
  usages: "قفل الاضافة",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const sub = (args[0] || "").trim();
  if (sub === "الاضافة" || sub === "الإضافة") {
    return helper.setEnabled(api, event, true);
  }
  return api.sendMessage("الاستخدام: قفل الاضافة", event.threadID, event.messageID);
};
