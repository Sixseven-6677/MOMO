const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname);
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
  ensureDir();
  try { fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8"); } catch (e) {}
}

function getThreadSettings(data, threadID) {
  const tid = String(threadID);
  if (!data[tid]) data[tid] = { enabled: false, pending: {} };
  if (!data[tid].pending) data[tid].pending = {};
  return data[tid];
}

async function isAuthorized(api, senderID, threadID) {
  const adminIDs = (global.config.ADMINBOT || []).map(String);
  const sid = String(senderID);
  if (adminIDs.includes(sid)) return true;
  try {
    const info = await api.getThreadInfo(threadID);
    if (info && Array.isArray(info.adminIDs)) {
      if (info.adminIDs.some(a => String(a.id) === sid)) return true;
    }
  } catch (e) {}
  return false;
}

async function setEnabled(api, event, value) {
  const { threadID, messageID, senderID } = event;
  if (!(await isAuthorized(api, senderID, threadID))) {
    return api.sendMessage("❌ هذا الأمر مخصص لأدمن البوت أو أدمن القروب فقط", threadID, messageID);
  }
  const data = loadData();
  const settings = getThreadSettings(data, threadID);
  settings.enabled = !!value;
  saveData(data);
  if (value) {
    return api.sendMessage(
      "🔒 تم تفعيل قفل الإضافة\nأي شخص تتم إضافته من غير أدمن البوت سيتم إخراجه ووضعه في قائمة الانتظار حتى توافق عليه.\n\nللقبول: قبول <ID>\nللرفض: رفض <ID>\nلعرض القائمة: قائمة الاضافة",
      threadID, messageID
    );
  } else {
    return api.sendMessage("🔓 تم إيقاف قفل الإضافة. الإضافة الآن مفتوحة للجميع.", threadID, messageID);
  }
}

async function listPending(api, event) {
  const { threadID, messageID, senderID } = event;
  if (!(await isAuthorized(api, senderID, threadID))) {
    return api.sendMessage("❌ هذا الأمر مخصص لأدمن البوت أو أدمن القروب فقط", threadID, messageID);
  }
  const data = loadData();
  const settings = getThreadSettings(data, threadID);
  const ids = Object.keys(settings.pending);
  const status = settings.enabled ? "🔒 مفعّل" : "🔓 متوقف";
  if (ids.length === 0) {
    return api.sendMessage(`الحالة: ${status}\nلا يوجد أشخاص في قائمة الانتظار.`, threadID, messageID);
  }
  const lines = ids.map((uid, i) => {
    const p = settings.pending[uid];
    return `${i+1}. ${p.name} (${uid})\n   أضافه: ${p.addedByName} (${p.addedBy})`;
  });
  return api.sendMessage(
    `الحالة: ${status}\nقائمة الانتظار (${ids.length}):\n\n${lines.join("\n\n")}\n\nللقبول: قبول <ID>\nللرفض: رفض <ID>`,
    threadID, messageID
  );
}

async function approve(api, event, args) {
  const { threadID, messageID, senderID } = event;
  if (!(await isAuthorized(api, senderID, threadID))) {
    return api.sendMessage("❌ هذا الأمر مخصص لأدمن البوت أو أدمن القروب فقط", threadID, messageID);
  }
  const uid = String(args[0] || "").trim();
  if (!/^\d{5,}$/.test(uid)) {
    return api.sendMessage("❌ اكتب: قبول <ID>", threadID, messageID);
  }
  const data = loadData();
  const settings = getThreadSettings(data, threadID);
  try {
    await api.addUserToGroup(uid, threadID);
    const name = settings.pending[uid]?.name || uid;
    delete settings.pending[uid];
    saveData(data);
    return api.sendMessage(`✅ تمت الموافقة وإضافة ${name} (${uid}) إلى القروب`, threadID, messageID);
  } catch (e) {
    return api.sendMessage(
      `❌ فشلت الإضافة\nالأسباب المحتملة:\n• الشخص لا يقبل إضافات الغرباء\n• البوت ليس عضواً في القروب\n• ID غير صحيح`,
      threadID, messageID
    );
  }
}

async function reject(api, event, args) {
  const { threadID, messageID, senderID } = event;
  if (!(await isAuthorized(api, senderID, threadID))) {
    return api.sendMessage("❌ هذا الأمر مخصص لأدمن البوت أو أدمن القروب فقط", threadID, messageID);
  }
  const uid = String(args[0] || "").trim();
  if (!/^\d{5,}$/.test(uid)) {
    return api.sendMessage("❌ اكتب: رفض <ID>", threadID, messageID);
  }
  const data = loadData();
  const settings = getThreadSettings(data, threadID);
  if (settings.pending[uid]) {
    const name = settings.pending[uid].name || uid;
    delete settings.pending[uid];
    saveData(data);
    return api.sendMessage(`🚫 تم رفض ${name} (${uid}) وحذفه من قائمة الانتظار`, threadID, messageID);
  }
  return api.sendMessage("⚠️ هذا الـ ID ليس في قائمة الانتظار", threadID, messageID);
}

module.exports = { setEnabled, listPending, approve, reject };
