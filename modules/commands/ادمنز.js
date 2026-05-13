module.exports.config = {
  name: "ادمنز",
  version: "1.0.0",
  hasPermssion: 3,
  credits: "FANG",
  description: "عرض قائمة ادمن البوت",
  commandCategory: "إدارة",
  usages: "ادمنز",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  const adminIDs = global.config.ADMINBOT || [];
  if (adminIDs.length === 0)
    return api.sendMessage("⚠️ لا يوجد ادمن مسجل حالياً", threadID, messageID);

  let text = "👑 ┌─── قائمة الادمن ───┐\n\n";
  for (let i = 0; i < adminIDs.length; i++) {
    let name = adminIDs[i];
    try {
      const info = await api.getUserInfo(adminIDs[i]);
      name = info[adminIDs[i]]?.name || adminIDs[i];
    } catch(e) {}
    text += `${i+1}. 👤 ${name}\n   🔑 ID: ${adminIDs[i]}\n\n`;
  }
  text += `└──────────────────────┘\n📊 الإجمالي: ${adminIDs.length} ادمن`;
  return api.sendMessage(text, threadID, messageID);
};