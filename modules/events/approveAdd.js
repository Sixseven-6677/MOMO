const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "commands", "data", "approveAdd.json");

function loadData() {
  try {
    if (fs.existsSync(dataPath)) {
      const d = JSON.parse(fs.readFileSync(dataPath, "utf8"));
      if (d && typeof d === "object") return d;
    }
  } catch (e) {}
  return {};
}

function saveData(data) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {}
}

module.exports.config = {
  name: "approveAdd",
  eventType: ["log:subscribe"],
  version: "2.0.0",
  credits: "XAVIER",
  description: "قفل الإضافة: عند تفعيله، أي شخص يُضاف من قبل غير أدمن البوت/القروب يُطرد فوراً ويوضع في قائمة الانتظار حتى الموافقة عليه."
};

module.exports.run = async function({ api, event }) {
  try {
    const { threadID, logMessageData, author } = event;
    if (!logMessageData || !Array.isArray(logMessageData.addedParticipants)) return;

    const data = loadData();
    const tid = String(threadID);
    const settings = data[tid];
    if (!settings || !settings.enabled) return;

    const botID = String(api.getCurrentUserID());
    const adminBotIDs = (global.config.ADMINBOT || []).map(String);
    const authorStr = String(author);

    // If the bot itself or one of its admins added the user → allow
    if (authorStr === botID || adminBotIDs.includes(authorStr)) return;

    // Check if author is admin of the group → allow
    let isThreadAdmin = false;
    try {
      const info = await api.getThreadInfo(threadID);
      if (info && Array.isArray(info.adminIDs)) {
        isThreadAdmin = info.adminIDs.some(a => String(a.id) === authorStr);
      }
    } catch (e) {}
    if (isThreadAdmin) return;

    if (!settings.pending) settings.pending = {};

    let addedByName = authorStr;
    try {
      const info = await api.getUserInfo(authorStr);
      if (info && info[authorStr] && info[authorStr].name) addedByName = info[authorStr].name;
    } catch (e) {}

    const kicked = [];
    for (const p of logMessageData.addedParticipants) {
      const uid = String(p.userFbId || p.userId || p.fbId || "");
      if (!uid || uid === botID) continue;
      const name = p.fullName || p.name || uid;
      try {
        await api.removeUserFromGroup(uid, threadID);
        settings.pending[uid] = {
          name,
          addedBy: authorStr,
          addedByName,
          at: Date.now()
        };
        kicked.push({ uid, name });
      } catch (e) {}
    }

    if (kicked.length === 0) return;
    saveData(data);

    const lines = kicked.map(k => `• ${k.name} (${k.uid})`).join("\n");
    api.sendMessage(
      `🔒 𝑸𝒇𝒍 𝑨𝒍-𝑰𝒅𝒂𝒇𝒂\n\n` +
      `أضافه: ${addedByName} (${authorStr})\n` +
      `تم إخراج ووضع في قائمة الانتظار:\n${lines}\n\n` +
      `للقبول: قبول <ID>\nللرفض: رفض <ID>\nللعرض: قائمة الاضافة`,
      threadID
    );
  } catch (e) {}
};
