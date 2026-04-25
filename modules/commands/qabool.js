const helper = require("./data/approveAdd_helper.js");

module.exports.config = {
  name: "قبول",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "قبول شخص من قائمة انتظار قفل الإضافة وإضافته للقروب",
  commandCategory: "أوامر",
  usages: "قبول <ID>",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  return helper.approve(api, event, args);
};
