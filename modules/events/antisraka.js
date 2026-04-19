const adminRemoveTracker = global.adminRemoveTracker || (global.adminRemoveTracker = new Map());

module.exports.config = {
  name: "antisraka",
  eventType: ["log:thread-admins"],
  version: "1.0.0",
  credits: "XAVIER",
  description: "حماية من السرقة - يطرد من يزيل 3 أدمنز"
};

module.exports.run = async function({ api, event, Users }) {
  const { logMessageData, threadID, author } = event;

  if (logMessageData.ADMIN_EVENT !== "remove_admin") return;

  const botID = api.getCurrentUserID();
  const { ADMINBOT } = global.config;

  if (author == botID) return;
  if (ADMINBOT.includes(String(author))) return;

  const key = `${threadID}_${author}`;
  const now = Date.now();

  let record = adminRemoveTracker.get(key) || { count: 0, times: [] };

  record.times = record.times.filter(t => now - t < 10 * 60 * 1000);
  record.times.push(now);
  record.count = record.times.length;

  adminRemoveTracker.set(key, record);

  if (record.count >= 3) {
    adminRemoveTracker.delete(key);

    let name = author;
    try {
      const info = await api.getUserInfo(author);
      name = info[author]?.name || author;
    } catch (e) {}

    try {
      await api.removeUserFromGroup(author, threadID);
    } catch (e) {}

    return api.sendMessage(
      `⚠️ 𝑿𝑨𝑽𝑰𝑬𝑹 ᚔ 𝑨𝑵𝑻𝑰 𝑺𝑹𝑨𝑲𝑨\n\n` +
      `🚫 تم طرد: ${name}\n` +
      `📋 السبب: أزال ${record.count} أدمنز من الكروب\n` +
      `🛡 تم حماية الكروب بنجاح`,
      threadID
    );
  }

  if (record.count === 2) {
    let name = author;
    try {
      const info = await api.getUserInfo(author);
      name = info[author]?.name || author;
    } catch (e) {}

    return api.sendMessage(
      `⚠️ تحذير لـ ${name}\nأزلت ${record.count} أدمنز - إذا أزلت واحد أخير سيتم طردك تلقائياً!`,
      threadID
    );
  }
};
