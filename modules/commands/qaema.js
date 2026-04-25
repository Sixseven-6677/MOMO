const helper = require("./data/approveAdd_helper.js");

module.exports.config = {
  name: "قائمة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "عرض قائمة انتظار قفل الإضافة",
  commandCategory: "أوامر",
  usages: "قائمة الاضافة",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const sub = (args[0] || "").trim();
  if (sub === "الاضافة" || sub === "الإضافة") {
    return helper.listPending(api, event);
  }
  return api.sendMessage("الاستخدام: قائمة الاضافة", event.threadID, event.messageID);
};
