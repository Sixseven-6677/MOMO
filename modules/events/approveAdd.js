const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "commands", "data");
const dataPath = path.join(dataDir, "approveAdd.json");

function ensureDir() {
  try { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }); } catch (e) {}
}

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
    ensureDir();
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {}
}

module.exports.config = {
  name: "approveAdd",
  eventType: ["log:subscribe"],
  version: "1.0.0",
  credits: "XAVIER",
  description: "عند تفعيل قفل الإضافة، يقوم البوت بإخراج أي شخص يضاف ووضعه في قائمة انتظار حتى يوافق عليه الأدمن"
};

module.exports.run = async function({ api, event, Users }) {
  try {
    const { threadID, logMessageData, author } = event;
    if (!logMessageData || !logMessageData.addedParticipants) return;

    const data = loadData();
    const settings = data[String(threadID)];
    if (!settings || !settings.enabled) return;

    const botID = String(api.getCurrentUserID());
    const adminIDs = (global.config.ADMINBOT || []).map(String);
    const authorStr = String(author);

    // The bot adding people = auto allowed
    if (authorStr === botID) return;
    // Bot admin adding people = auto allowed
    if (adminIDs.includes(authorStr)) return;

    if (!settings.pending) settings.pending = {};

    let authorName = "";
    try {
      const aData = await Users.getData(authorStr);
      authorName = aData?.name || "";
    } catch (e) {}
    if (!authorName) {
      try {
        const info = await api.getUserInfo(authorStr);
        authorName = info[authorStr]?.name || authorStr;
      } catch (e) { authorName = authorStr; }
    }

    const kicked = [];
    for (const p of logMessageData.addedParticipants) {
      const uid = String(p.userFbId);
      if (uid === botID) continue;             // never kick the bot
      if (adminIDs.includes(uid)) continue;    // never kick a bot admin

      try {
        await new Promise((resolve) => {
          api.removeUserFromGroup(uid, threadID, () => resolve());
        });
        settings.pending[uid] = {
          name: p.fullName || uid,
          addedBy: authorStr,
          addedByName: authorName,
          time: Date.now()
        };
        kicked.push(`• ${p.fullName || uid} (${uid})`);
      } catch (e) {}
    }

    data[String(threadID)] = settings;
    saveData(data);

    if (kicked.length > 0) {
      const msg =
`🔒 قفل الإضافة مفعل
تمت إضافة الأشخاص التالية بواسطة: ${authorName} (${authorStr})
${kicked.join("\n")}

تم إخراجهم مؤقتاً وانتظار موافقة الأدمن.
لقبول شخص: قبول <ID>
لرفض شخص: رفض <ID>
لعرض القائمة: قائمة الاضافة`;
      api.sendMessage(msg, threadID);
    }
  } catch (e) {}
};
