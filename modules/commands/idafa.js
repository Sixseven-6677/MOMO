const fs = require("fs");
const path = require("path");
const dataPath = path.join(__dirname, "data", "addLock.json");

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
  name: "اضافة",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "إضافة شخص للقروب + قفل/فتح الإضافة + قبول الحسابات المعلقة",
  commandCategory: "أوامر",
  usages: "اضافة [ID] | اضافة اغلاق | اضافة فتح | اضافة حساب [رقم] | اضافة قائمة",
  cooldowns: 0
};

async function isThreadAdmin(api, threadID, userID) {
  try {
    const info = global.data.threadInfo?.get(threadID) || await api.getThreadInfo(threadID);
    return (info.adminIDs || []).some(a => String(a.id || a) === String(userID));
  } catch (e) {
    return false;
  }
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const adminIDs = global.config.ADMINBOT || [];
  const isBotAdmin = adminIDs.includes(String(senderID));
  const isAdmin = isBotAdmin || await isThreadAdmin(api, threadID, senderID);

  const data = loadData();
  if (!data[threadID]) data[threadID] = { locked: false, pending: [] };

  const sub = String(args[0] || "").trim();

  if (sub === "اغلاق") {
    if (!isAdmin) return api.sendMessage("❌ هذا الأمر لأدمن القروب أو أدمن البوت", threadID, messageID);
    data[threadID].locked = true;
    saveData(data);
    return api.sendMessage(
      "🔒 تم إغلاق الإضافة\nأي حساب يحاول أحد إضافته سيتم طرده ووضعه في قائمة الانتظار\n\nللفتح: اضافة فتح\nلعرض قائمة الانتظار: اضافة قائمة",
      threadID, messageID
    );
  }

  if (sub === "فتح") {
    if (!isAdmin) return api.sendMessage("❌ هذا الأمر لأدمن القروب أو أدمن البوت", threadID, messageID);
    data[threadID].locked = false;
    saveData(data);
    return api.sendMessage("🔓 تم فتح الإضافة\nأي شخص يقدر يضيف حسابات بحرية", threadID, messageID);
  }

  if (sub === "قائمة") {
    const pending = data[threadID].pending || [];
    if (pending.length === 0) return api.sendMessage("📭 قائمة الانتظار فارغة", threadID, messageID);
    let lines = pending.map((p, i) => `${i + 1}. ${p.name || p.userID} (${p.userID})`);
    return api.sendMessage(
      `📋 الحسابات في قائمة الانتظار:\n\n${lines.join("\n")}\n\nللقبول: اضافة حساب [الرقم]`,
      threadID, messageID
    );
  }

  if (sub === "حساب") {
    if (!isAdmin) return api.sendMessage("❌ هذا الأمر لأدمن القروب أو أدمن البوت", threadID, messageID);
    const num = parseInt(args[1]);
    const pending = data[threadID].pending || [];
    if (isNaN(num) || num < 1 || num > pending.length) {
      return api.sendMessage(
        `❌ رقم غير صحيح\nاستخدم: اضافة قائمة لعرض الأرقام`,
        threadID, messageID
      );
    }
    const acc = pending[num - 1];
    try {
      await api.addUserToGroup(acc.userID, threadID);
      pending.splice(num - 1, 1);
      data[threadID].pending = pending;
      saveData(data);
      return api.sendMessage(`✅ تمت إضافة ${acc.name || acc.userID} للقروب`, threadID, messageID);
    } catch (e) {
      return api.sendMessage(`❌ فشلت الإضافة: ${e?.error || "خطأ غير معروف"}`, threadID, messageID);
    }
  }

  if (!isBotAdmin) return api.sendMessage("❌ الإضافة المباشرة لأدمن البوت فقط", threadID, messageID);

  let targetID = String(args[0] || "").trim();
  if (!targetID) targetID = String(senderID);

  if (!/^\d{8,}$/.test(targetID)) {
    return api.sendMessage(
      "📝 الاستخدام:\n• اضافة [ID] ← يضيف الشخص\n• اضافة ← يضيفك أنت\n• اضافة اغلاق / فتح\n• اضافة قائمة\n• اضافة حساب [رقم]",
      threadID, messageID
    );
  }

  try {
    await api.addUserToGroup(targetID, threadID);
    let name = targetID;
    try {
      const info = await api.getUserInfo(targetID);
      name = info[targetID]?.name || targetID;
    } catch (e) {}
    return api.sendMessage(`✅ تمت إضافة ${name} (${targetID}) إلى القروب`, threadID, messageID);
  } catch (e) {
    return api.sendMessage(
      `❌ فشلت الإضافة\n• الشخص قد لا يقبل إضافات الغرباء\n• تأكد أن البوت موجود في القروب`,
      threadID, messageID
    );
  }
};
