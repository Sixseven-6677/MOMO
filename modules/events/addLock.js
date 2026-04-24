const fs = require("fs");
const path = require("path");
const dataPath = path.join(__dirname, "../commands/data/addLock.json");

function loadData() {
  try {
    if (fs.existsSync(dataPath)) return JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch (e) {}
  return {};
}

function saveData(d) {
  try {
    if (!fs.existsSync(path.dirname(dataPath))) fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(d, null, 2));
  } catch (e) {}
}

module.exports.config = {
  name: "addLock",
  eventType: ["log:subscribe"],
  version: "1.0.0",
  credits: "XAVIER",
  description: "قفل الإضافة لغير الأدمن مع قائمة انتظار"
};

module.exports.run = async function({ api, event }) {
  try {
    const { threadID, logMessageData, author } = event;
    const botID = api.getCurrentUserID();

    if (String(author) === String(botID)) return;

    const data = loadData();
    const cfg = data[threadID];
    if (!cfg || !cfg.locked) return;

    const adminIDs = global.config.ADMINBOT || [];
    if (adminIDs.includes(String(author))) return;

    let isGroupAdmin = false;
    try {
      const info = global.data.threadInfo?.get(threadID) || await api.getThreadInfo(threadID);
      isGroupAdmin = (info.adminIDs || []).some(a => String(a.id || a) === String(author));
    } catch (e) {}
    if (isGroupAdmin) return;

    const added = (logMessageData?.addedParticipants || []).filter(p => String(p.userFbId) !== String(botID));
    if (added.length === 0) return;

    const removedNames = [];
    for (const p of added) {
      try {
        await api.removeUserFromGroup(p.userFbId, threadID);
      } catch (e) {}

      cfg.pending = cfg.pending || [];
      const exists = cfg.pending.some(x => String(x.userID) === String(p.userFbId));
      if (!exists) {
        cfg.pending.push({
          userID: String(p.userFbId),
          name: p.fullName || String(p.userFbId),
          addedBy: String(author),
          time: Date.now()
        });
      }
      removedNames.push(p.fullName || String(p.userFbId));
    }

    saveData(data);

    let authorName = String(author);
    try {
      const ainfo = await api.getUserInfo(author);
      authorName = ainfo[author]?.name || authorName;
    } catch (e) {}

    api.sendMessage(
      `🔒 الإضافة مغلقة في هذا القروب\n\n` +
      `الذي حاول الإضافة: ${authorName}\n` +
      `تم طرد: ${removedNames.join("، ")}\n\n` +
      `تمت إضافتهم لقائمة الانتظار.\n` +
      `لقبولهم: اضافة قائمة ← لعرض الأرقام\nثم: اضافة حساب [رقم]`,
      threadID
    );
  } catch (e) {}
};
