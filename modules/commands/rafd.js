const helper = require("./data/approveAdd_helper.js");

module.exports.config = {
  name: "رفض",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "رفض شخص من قائمة انتظار قفل الإضافة",
  commandCategory: "أوامر",
  usages: "رفض <ID>",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  return helper.reject(api, event, args);
};
