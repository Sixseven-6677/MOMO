const fs   = require("fs");
const path = require("path");
const dataPath = path.join(process.cwd(), "modules/commands/data/protectedNicks.json");

function loadNicks() {
  try { return JSON.parse(fs.readFileSync(dataPath, "utf8")); } catch(e) { return {}; }
}
function saveNicks(obj) {
  try {
    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(obj, null, 2));
  } catch(e) {}
}

module.exports.config = {
  name: "كنية",
  version: "1.0.0",
  hasPermssion: 3,
  credits: "FANG",
  description: "تغيير كنيات القروب كلها مع حمايتها من التغيير",
  commandCategory: "إدارة",
  usages: "كنية [الكنية]",
  cooldowns: 10
};

module.exports.onLoad = function() {
  if (!global.protectedNicks) global.protectedNicks = {};
  const data = loadNicks();
  Object.assign(global.protectedNicks, data);
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const nick = args.join(" ").trim();

  if (!nick)
    return api.sendMessage("❌ اكتب الكنية بعد الأمر\nمثال: كنية ⚔️ فارس", threadID, messageID);

  let threadInfo;
  try { threadInfo = await api.getThreadInfo(threadID); } catch(e) {
    return api.sendMessage("❌ تعذر جلب معلومات القروب", threadID, messageID);
  }

  const participants = (threadInfo.participantIDs || []).filter(id => id !== api.getCurrentUserID());
  await api.sendMessage(`🔄 جاري تطبيق الكنية على ${participants.length} شخص...`, threadID);

  let done = 0;
  for (const uid of participants) {
    try { await new Promise((res, rej) => api.changeNickname(nick, threadID, uid, e => e ? rej(e) : res())); done++; } catch(e) {}
    await new Promise(r => setTimeout(r, 500));
  }

  if (!global.protectedNicks) global.protectedNicks = {};
  global.protectedNicks[threadID] = nick;
  const data = loadNicks();
  data[threadID] = nick;
  saveNicks(data);

  return api.sendMessage(
    `✅ تم تطبيق الكنية على ${done} شخص\n📝 الكنية: "${nick}"\n\n🛡 الحماية مفعّلة — لن يتمكن أحد من تغييرها`,
    threadID, messageID
  );
};