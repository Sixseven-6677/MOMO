const lastSeenData = global.lastSeenData || (global.lastSeenData = new Map());
// Map<threadID_userID, timestamp>

function timeSince(ms) {
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return d + " يوم و " + (h % 24) + " ساعة";
  if (h > 0) return h + " ساعة و " + (m % 60) + " دقيقة";
  if (m > 0) return m + " دقيقة و " + (s % 60) + " ثانية";
  return s + " ثانية";
}

function fmtTime(ms) {
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mo   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  const hh   = String(d.getHours()).padStart(2, "0");
  const mm   = String(d.getMinutes()).padStart(2, "0");
  const ss   = String(d.getSeconds()).padStart(2, "0");
  return dd + "/" + mo + "/" + yyyy + " - " + hh + ":" + mm + ":" + ss;
}

module.exports.config = {
  name: "ظهور",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "عرض آخر وقت إرسال رسالة لعضو في الغروب",
  commandCategory: "إدارة الغروب",
  usages: "ظهور | ظهور [ID] | رد على رسالة + ظهور",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply } = event;

  let targetID;
  if (messageReply && messageReply.senderID) {
    targetID = String(messageReply.senderID);
  } else if (args[0] && /^\d{6,}$/.test(args[0])) {
    targetID = args[0].trim();
  } else {
    targetID = String(senderID);
  }

  const key = threadID + "_" + targetID;
  const ts  = lastSeenData.get(key);

  let name = targetID;
  try {
    const info = await api.getUserInfo(targetID);
    name = info[targetID]?.name || targetID;
  } catch(e) {}

  if (!ts)
    return api.sendMessage(
      "👤 " + name + "\n🆔 " + targetID + "\n━━━━━━━━━━━━━━\n📭 لم يُسجَّل له أي رسالة منذ بدء تشغيل البوت",
      threadID, messageID
    );

  return api.sendMessage(
    "👤 " + name + "\n🆔 " + targetID + "\n━━━━━━━━━━━━━━\n🕐 آخر ظهور: " + fmtTime(ts) + "\n⏳ منذ: " + timeSince(ts),
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  if (event.type !== "message" && event.type !== "message_reply") return;
  if (!event.senderID || !event.threadID) return;
  // تجاهل رسائل البوت نفسه
  try {
    const botID = api.getCurrentUserID();
    if (String(event.senderID) === String(botID)) return;
  } catch(e) {}
  const key = event.threadID + "_" + event.senderID;
  lastSeenData.set(key, Date.now());
};
