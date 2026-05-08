const rudud = global.rudud || (global.rudud = new Map());
// Map<threadID, Map<keyword, reply>>

function getThreadMap(threadID) {
  if (!rudud.has(threadID)) rudud.set(threadID, new Map());
  return rudud.get(threadID);
}

module.exports.config = {
  name: "ردود",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MOMO",
  description: "إضافة ردود تلقائية عند ذكر كلمة معينة",
  commandCategory: "إدارة الغروب",
  usages: "ردود إضافة [كلمة] | [رد] — ردود حذف [كلمة] — ردود عرض",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const adminIDs = (global.config && global.config.ADMINBOT) || [];
  if (!adminIDs.includes(String(senderID)))
    return api.sendMessage("❌ هذا الأمر لأدمن البوت فقط", threadID, messageID);

  const sub = args[0];
  const map = getThreadMap(threadID);

  // ردود إضافة [كلمة] | [رد]
  if (sub === "إضافة") {
    const rest = args.slice(1).join(" ");
    const sep = rest.indexOf("|");
    if (sep === -1)
      return api.sendMessage("❌ الاستخدام: ردود إضافة [كلمة] | [الرد]", threadID, messageID);
    const keyword = rest.slice(0, sep).trim().toLowerCase();
    const reply   = rest.slice(sep + 1).trim();
    if (!keyword || !reply)
      return api.sendMessage("❌ الكلمة أو الرد فارغ", threadID, messageID);
    map.set(keyword, reply);
    return api.sendMessage(`✅ تم إضافة الرد التلقائي\n🔑 الكلمة: "${keyword}"\n💬 الرد: "${reply}"`, threadID, messageID);
  }

  // ردود حذف [كلمة]
  if (sub === "حذف") {
    const keyword = args.slice(1).join(" ").trim().toLowerCase();
    if (!map.has(keyword))
      return api.sendMessage(`⚠️ الكلمة "${keyword}" غير موجودة`, threadID, messageID);
    map.delete(keyword);
    return api.sendMessage(`✅ تم حذف الرد التلقائي للكلمة "${keyword}"`, threadID, messageID);
  }

  // ردود مسح
  if (sub === "مسح") {
    map.clear();
    return api.sendMessage("✅ تم مسح جميع الردود التلقائية", threadID, messageID);
  }

  // ردود عرض
  if (sub === "عرض" || !sub) {
    if (!map.size)
      return api.sendMessage("📭 لا توجد ردود تلقائية في هذا الغروب", threadID, messageID);
    const list = [...map.entries()].map(([ k, v ], i) =>
      `${i + 1}. 🔑 "${k}"\n   💬 "${v}"`
    ).join("\n\n");
    return api.sendMessage(`📋 الردود التلقائية (${map.size}):\n━━━━━━━━━━\n\n${list}`, threadID, messageID);
  }

  return api.sendMessage(
    `📖 أوامر الردود التلقائية:\n\n• ردود إضافة [كلمة] | [رد]\n• ردود حذف [كلمة]\n• ردود مسح\n• ردود عرض`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  if (event.type !== "message" && event.type !== "message_reply") return;
  if (!event.body || !event.body.trim()) return;

  const { threadID, senderID } = event;
  const botID = (() => { try { return String(api.getCurrentUserID()); } catch(e){ return null; } })();
  if (botID && String(senderID) === botID) return;

  const map = getThreadMap(threadID);
  if (!map.size) return;

  const body = event.body.trim().toLowerCase();

  for (const [keyword, reply] of map.entries()) {
    if (body.includes(keyword)) {
      try { await api.sendMessage(reply, threadID); } catch (e) {}
      break;
    }
  }
};
