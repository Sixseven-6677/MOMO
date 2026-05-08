const lastSeenData = global.lastSeenData || (global.lastSeenData = new Map());
// Map<threadID_userID, timestamp>

function timeSince(ms) {
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0)  return `${d} يوم و ${h % 24} ساعة`;
  if (h > 0)  return `${h} ساعة و ${m % 60} دقيقة`;
  if (m > 0)  return `${m} دقيقة و ${s % 60} ثانية`;
  return `${s} ثانية`;
}

module.exports.config = {
  name: "آخر ظهور",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "عرض آخر وقت ظهور لعضو في الغروب",
  commandCategory: "إدارة الغروب",
  usages: "آخر ظهور | آخر ظهور [ID]",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply } = event;

  let targetID = args[0] || (messageReply && messageReply.senderID) || null;

  if (!targetID)
    return api.sendMessage("❌ رد على رسالة شخص أو اكتب ID ليتراجع", threadID, messageID);

  targetID = String(targetID).trim();
  const key = `${threadID}_${targetID}`;
  const ts  = lastSeenData.get(key);

  let name = targetID;
  try {
    const info = await api.getUserInfo(targetID);
    name = info[targetID]?.name || targetID;
  } catch(e) {}

  if (!ts)
    return api.sendMessage(`👤 ${name}\n📭 لم يُسجَّل له ظهور منذ بدء التشغيل`, threadID, messageID);

  const date = new Date(ts).toLocaleString("ar-SA");
  const ago  = timeSince(ts);

  return api.sendMessage(
    `👤 ${name}\n🆔 ${targetID}\n━━━━━━━━━━━━━━\n🕐 آخر ظهور: ${date}\n⏳ منذ: ${ago}`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  if (event.type !== "message" && event.type !== "message_reply") return;
  if (!event.senderID || !event.threadID) return;
  const key = `${event.threadID}_${event.senderID}`;
  lastSeenData.set(key, Date.now());
};
