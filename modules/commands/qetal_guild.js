const fs = require("fs");
const path = require("path");
const dataDir = path.join(__dirname, "data");
const playersPath = path.join(dataDir, "qetal_players.json");
const guildsPath  = path.join(dataDir, "qetal_guilds.json");

function loadPlayers() {
  try { if (!fs.existsSync(playersPath)) return {}; return JSON.parse(fs.readFileSync(playersPath, "utf8")); } catch { return {}; }
}
function savePlayers(d) {
  try { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(playersPath, JSON.stringify(d, null, 2)); } catch {}
}
function savePlayer(id, data) { const all = loadPlayers(); all[id] = data; savePlayers(all); }

function loadGuilds() {
  try { if (!fs.existsSync(guildsPath)) return {}; return JSON.parse(fs.readFileSync(guildsPath, "utf8")); } catch { return {}; }
}
function saveGuilds(d) {
  try { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(guildsPath, JSON.stringify(d, null, 2)); } catch {}
}

const activeWars = global.qetalGuildWars || (global.qetalGuildWars = new Map());

const GUILD_RANK_ICON = { ملك: "👑", ضابط: "⚔️", عضو: "🛡" };
const GUILD_LEVEL_EXP = (lv) => Math.floor(500 * Math.pow(1.5, lv - 1));

function guildInfo(g, allP) {
  const masterName = allP[g.master]?.name || g.master;
  const memberCount = (g.members || []).length;
  const expNext = GUILD_LEVEL_EXP(g.level || 1);
  return (
    `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n` +
    `➢ 𝑮𝑼𝑰𝑳𝑫 — ${g.name}\n` +
    `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n` +
    `👑 الملك: ${masterName}\n` +
    `📊 المستوى: ${g.level || 1} | XP: ${g.exp || 0}/${expNext}\n` +
    `⭐ الهيبة: ${g.reputation || 0}\n` +
    `🏦 الخزينة: ${g.treasury || 0} ذهب\n` +
    `👥 الأعضاء: ${memberCount}\n` +
    (g.decree ? `📜 المرسوم: ${g.decree}\n` : ``) +
    (g.warWith ? `⚔️ في حرب مع: ${g.warWith}\n` : ``) +
    `━━━━━━━━━━━━━━━━━\n` +
    `الأوامر: مملكة أعضاء | مملكة خزينة [مبلغ] | مملكة مجلس`
  );
}

// ═══════════════════════════════════════
module.exports.config = {
  name: "مملكة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAVIER",
  description: "نظام الممالك — أنشئ، انضم، تعاون واحتل",
  commandCategory: "ألعاب",
  usages: "مملكة | مملكة انشاء [اسم] | مملكة انضمام [اسم] | مملكة خروج | مملكة خزينة [مبلغ] | مملكة حرب [اسم] | مملكة تتويج | مملكة مرسوم [نص] | مملكة مجلس",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, mentions } = event;
  const sub = args[0] || "";

  const allP = loadPlayers();
  const pData = allP[senderID];
  if (!pData) return api.sendMessage("❌ ما عندك حساب! العب قتال أولاً", threadID, messageID);

  const guilds = loadGuilds();
  const myGuildName = pData.guild || null;
  const myGuild = myGuildName ? guilds[myGuildName] : null;

  let senderName = pData.name || senderID;

  // ── عرض المملكة ──
  if (!sub || sub === "معلومات" || sub === "info") {
    if (!myGuild) return api.sendMessage("❌ لست في أي مملكة!\nأنشئ واحدة: مملكة انشاء [اسم]\nأو انضم: مملكة انضمام [اسم]", threadID, messageID);
    return api.sendMessage(guildInfo(myGuild, allP), threadID, messageID);
  }

  // ── إنشاء مملكة ──
  if (sub === "انشاء") {
    if (myGuild) return api.sendMessage(`❌ أنت بالفعل في مملكة: ${myGuildName}\nاخرج منها أولاً: مملكة خروج`, threadID, messageID);
    const name = args.slice(1).join(" ").trim();
    if (!name) return api.sendMessage("❌ اكتب اسم المملكة\nمثال: مملكة انشاء مملكة الفجر", threadID, messageID);
    if (name.length > 30) return api.sendMessage("❌ الاسم طويل جداً (أقصى 30 حرف)", threadID, messageID);
    if (guilds[name]) return api.sendMessage("❌ هذا الاسم مأخوذ! جرب اسماً آخر", threadID, messageID);
    if ((pData.coins || 0) < 500) return api.sendMessage("❌ إنشاء مملكة يحتاج 500 ذهب\nرصيدك: " + (pData.coins || 0), threadID, messageID);

    pData.coins -= 500;
    pData.guild = name;
    pData.guildRank = "ملك";
    savePlayer(senderID, pData);

    guilds[name] = {
      name, master: senderID,
      officers: [], members: [senderID],
      treasury: 0, reputation: 0, level: 1, exp: 0,
      decree: "", warWith: null, warScore: null,
      created: Date.now()
    };
    saveGuilds(guilds);

    return api.sendMessage(
      `👑 تم إنشاء مملكة "${name}"!\n\n💰 تكلفة: 500 ذهب\n\nأنت ملك المملكة الآن!\nادعُ أعضاء: مملكة انضمام [اسم المملكة]`,
      threadID, messageID
    );
  }

  // ── انضمام ──
  if (sub === "انضمام") {
    if (myGuild) return api.sendMessage(`❌ أنت في مملكة "${myGuildName}" بالفعل. اخرج أولاً`, threadID, messageID);
    const name = args.slice(1).join(" ").trim();
    if (!name) return api.sendMessage("❌ اكتب اسم المملكة\nمثال: مملكة انضمام مملكة الفجر", threadID, messageID);
    const g = guilds[name];
    if (!g) return api.sendMessage(`❌ لا توجد مملكة باسم "${name}"`, threadID, messageID);
    if ((g.members || []).length >= 30) return api.sendMessage("❌ المملكة ممتلئة (30 عضو)", threadID, messageID);

    pData.guild = name;
    pData.guildRank = "عضو";
    savePlayer(senderID, pData);
    g.members = [...(g.members || []), senderID];
    saveGuilds(guilds);

    return api.sendMessage(
      `🛡 انضممت لمملكة "${name}"!\n👥 الأعضاء الآن: ${g.members.length}`,
      threadID, messageID
    );
  }

  // ── خروج ──
  if (sub === "خروج") {
    if (!myGuild) return api.sendMessage("❌ لست في أي مملكة", threadID, messageID);
    if (myGuild.master === senderID) {
      const otherMembers = (myGuild.members || []).filter(id => id !== senderID);
      if (otherMembers.length > 0) return api.sendMessage("❌ أنت الملك! تويج عضو قبل الخروج: مملكة تتويج [ردعلى رسالته]", threadID, messageID);
      delete guilds[myGuildName];
    } else {
      myGuild.members = (myGuild.members || []).filter(id => id !== senderID);
      myGuild.officers = (myGuild.officers || []).filter(id => id !== senderID);
      guilds[myGuildName] = myGuild;
    }
    pData.guild = null;
    pData.guildRank = null;
    savePlayer(senderID, pData);
    saveGuilds(guilds);
    return api.sendMessage(`✅ خرجت من مملكة "${myGuildName}"`, threadID, messageID);
  }

  // ── أعضاء ──
  if (sub === "أعضاء" || sub === "اعضاء") {
    if (!myGuild) return api.sendMessage("❌ لست في أي مملكة", threadID, messageID);
    const memberLines = (myGuild.members || []).map(id => {
      const p = allP[id];
      const rankIcon = GUILD_RANK_ICON[myGuild.master === id ? "ملك" : (myGuild.officers || []).includes(id) ? "ضابط" : "عضو"];
      return `${rankIcon} ${p?.name || id} — Lv.${p?.level || 1} ${p?.rank || "E"} | 🏆${p?.wins || 0}`;
    });
    return api.sendMessage(
      `👥 أعضاء مملكة ${myGuildName} (${memberLines.length}):\n━━━━━━━━━━━━━━━━━\n` + memberLines.join("\n"),
      threadID, messageID
    );
  }

  // ── خزينة ──
  if (sub === "خزينة") {
    if (!myGuild) return api.sendMessage("❌ لست في أي مملكة", threadID, messageID);
    const amount = parseInt(args[1]);
    if (!args[1]) return api.sendMessage(`🏦 خزينة مملكة ${myGuildName}: ${myGuild.treasury || 0} ذهب\nللتبرع: مملكة خزينة [مبلغ]`, threadID, messageID);
    if (isNaN(amount) || amount <= 0) return api.sendMessage("❌ مبلغ غير صحيح", threadID, messageID);
    if ((pData.coins || 0) < amount) return api.sendMessage(`❌ ذهبك غير كافٍ! رصيدك: ${pData.coins || 0}`, threadID, messageID);
    pData.coins -= amount;
    myGuild.treasury = (myGuild.treasury || 0) + amount;
    myGuild.exp = (myGuild.exp || 0) + Math.floor(amount / 10);

    // Level up guild
    while ((myGuild.exp || 0) >= GUILD_LEVEL_EXP(myGuild.level || 1)) {
      myGuild.exp -= GUILD_LEVEL_EXP(myGuild.level);
      myGuild.level = (myGuild.level || 1) + 1;
    }

    savePlayer(senderID, pData);
    guilds[myGuildName] = myGuild;
    saveGuilds(guilds);
    return api.sendMessage(
      `💰 تبرعت بـ ${amount} ذهب للخزينة!\n🏦 إجمالي الخزينة: ${myGuild.treasury}\n📊 مستوى المملكة: ${myGuild.level}`,
      threadID, messageID
    );
  }

  // ── ترتيب الممالك ──
  if (sub === "ترتيب") {
    const sorted = Object.values(guilds).sort((a, b) => (b.reputation || 0) - (a.reputation || 0)).slice(0, 10);
    const medals = ["🥇", "🥈", "🥉"];
    const lines = sorted.map((g, i) =>
      `${medals[i] || `${i + 1}.`} ${g.name} | Lv.${g.level || 1} | ⭐${g.reputation || 0} | 👥${(g.members || []).length}`
    );
    return api.sendMessage(
      `⌁⋯᚛ᚘ᚜🗞️᚛ᚘ᚜🏳️᚛ᚘ᚜🗞️᚛ᚘ᚜⋯⌁\n➢ 𝑮𝑼𝑰𝑳𝑫 𝑹𝑨𝑵𝑲𝑰𝑵𝑮\n━━━━━━━━━━━━━━━━━\n` +
      (lines.length ? lines.join("\n") : "لا توجد ممالك بعد!"),
      threadID, messageID
    );
  }

  // ═══════════ أوامر الملك والضباط فقط ═══════════
  const isMaster   = myGuild && myGuild.master === senderID;
  const isOfficer  = myGuild && ((myGuild.officers || []).includes(senderID) || isMaster);

  // ── مرسوم ──
  if (sub === "مرسوم") {
    if (!myGuild) return api.sendMessage("❌ لست في أي مملكة", threadID, messageID);
    if (!isMaster) return api.sendMessage("❌ فقط الملك يمكنه إصدار مراسيم", threadID, messageID);
    const decree = args.slice(1).join(" ").trim();
    if (!decree) return api.sendMessage("❌ اكتب نص المرسوم\nمثال: مملكة مرسوم كل عضو يقاتل 3 معارك اليوم!", threadID, messageID);
    myGuild.decree = decree;
    guilds[myGuildName] = myGuild;
    saveGuilds(guilds);
    return api.sendMessage(
      `📜 مرسوم ملكي جديد من ${senderName}:\n\n"${decree}"\n\n— مملكة ${myGuildName}`,
      threadID
    );
  }

  // ── مجلس ──
  if (sub === "مجلس") {
    if (!myGuild) return api.sendMessage("❌ لست في أي مملكة", threadID, messageID);
    if (!isMaster) return api.sendMessage("❌ فقط الملك يدير المجلس", threadID, messageID);
    const officers = (myGuild.officers || []).map(id => allP[id]?.name || id);
    return api.sendMessage(
      `⚔️ مجلس مملكة ${myGuildName}\n━━━━━━━━━━━━━━━━━\n` +
      `👑 الملك: ${senderName}\n` +
      `⚔️ الضباط (${officers.length}):\n${officers.length ? officers.map(n => `• ${n}`).join("\n") : "لا يوجد ضباط بعد"}\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `لتعيين ضابط: مملكة ضابط [رد على رسالته]\nلعزل ضابط: مملكة عزل [رد على رسالته]`,
      threadID, messageID
    );
  }

  // ── تتويج ──
  if (sub === "تتويج") {
    if (!myGuild) return api.sendMessage("❌ لست في أي مملكة", threadID, messageID);
    if (!isMaster) return api.sendMessage("❌ فقط الملك يمكنه التتويج", threadID, messageID);
    if (!event.messageReply?.senderID) return api.sendMessage("❌ رد على رسالة الشخص الذي تريد تتويجه", threadID, messageID);
    const targetID = String(event.messageReply.senderID);
    if (!(myGuild.members || []).includes(targetID)) return api.sendMessage("❌ هذا الشخص ليس في مملكتك", threadID, messageID);
    if (targetID === senderID) return api.sendMessage("❌ أنت الملك بالفعل!", threadID, messageID);

    myGuild.master = targetID;
    allP[senderID].guildRank = "ضابط";
    allP[targetID].guildRank = "ملك";
    savePlayer(senderID, allP[senderID]);
    savePlayer(targetID, allP[targetID]);
    guilds[myGuildName] = myGuild;
    saveGuilds(guilds);

    return api.sendMessage(
      `👑 تتويج ملكي!\n\n${senderName} تنازل عن العرش لـ ${allP[targetID]?.name || targetID}!\n\n👑 الملك الجديد: ${allP[targetID]?.name || targetID}\n— مملكة ${myGuildName}`,
      threadID
    );
  }

  // ── تعيين ضابط ──
  if (sub === "ضابط") {
    if (!myGuild || !isMaster) return api.sendMessage("❌ فقط الملك يعين الضباط", threadID, messageID);
    if (!event.messageReply?.senderID) return api.sendMessage("❌ رد على رسالة الشخص", threadID, messageID);
    const targetID = String(event.messageReply.senderID);
    if (!(myGuild.members || []).includes(targetID)) return api.sendMessage("❌ الشخص ليس في مملكتك", threadID, messageID);
    if ((myGuild.officers || []).includes(targetID)) return api.sendMessage("✅ هو ضابط بالفعل", threadID, messageID);
    myGuild.officers = [...(myGuild.officers || []), targetID];
    allP[targetID].guildRank = "ضابط";
    savePlayer(targetID, allP[targetID]);
    guilds[myGuildName] = myGuild;
    saveGuilds(guilds);
    return api.sendMessage(`⚔️ تم تعيين ${allP[targetID]?.name || targetID} ضابطاً في مملكة ${myGuildName}!`, threadID);
  }

  // ── عزل ضابط ──
  if (sub === "عزل") {
    if (!myGuild || !isMaster) return api.sendMessage("❌ فقط الملك يعزل الضباط", threadID, messageID);
    if (!event.messageReply?.senderID) return api.sendMessage("❌ رد على رسالة الشخص", threadID, messageID);
    const targetID = String(event.messageReply.senderID);
    myGuild.officers = (myGuild.officers || []).filter(id => id !== targetID);
    allP[targetID].guildRank = "عضو";
    savePlayer(targetID, allP[targetID]);
    guilds[myGuildName] = myGuild;
    saveGuilds(guilds);
    return api.sendMessage(`✅ تم عزل ${allP[targetID]?.name || targetID} من منصب الضابط`, threadID);
  }

  // ── طرد عضو ──
  if (sub === "طرد") {
    if (!myGuild || !isOfficer) return api.sendMessage("❌ فقط الملك والضباط يطردون الأعضاء", threadID, messageID);
    if (!event.messageReply?.senderID) return api.sendMessage("❌ رد على رسالة الشخص الذي تريد طرده", threadID, messageID);
    const targetID = String(event.messageReply.senderID);
    if (targetID === myGuild.master) return api.sendMessage("❌ لا يمكن طرد الملك", threadID, messageID);
    if (!(myGuild.members || []).includes(targetID)) return api.sendMessage("❌ الشخص ليس في مملكتك", threadID, messageID);
    myGuild.members = (myGuild.members || []).filter(id => id !== targetID);
    myGuild.officers = (myGuild.officers || []).filter(id => id !== targetID);
    allP[targetID].guild = null;
    allP[targetID].guildRank = null;
    savePlayer(targetID, allP[targetID]);
    guilds[myGuildName] = myGuild;
    saveGuilds(guilds);
    return api.sendMessage(`✅ تم طرد ${allP[targetID]?.name || targetID} من مملكة ${myGuildName}`, threadID);
  }

  // ── إعلان حرب ──
  if (sub === "حرب") {
    if (!myGuild) return api.sendMessage("❌ لست في أي مملكة", threadID, messageID);
    if (!isMaster) return api.sendMessage("❌ فقط الملك يعلن الحرب", threadID, messageID);
    if (myGuild.warWith) return api.sendMessage(`❌ أنتم في حرب بالفعل مع "${myGuild.warWith}"`, threadID, messageID);
    const targetName = args.slice(1).join(" ").trim();
    if (!targetName) return api.sendMessage("❌ اكتب اسم المملكة\nمثال: مملكة حرب مملكة الظلام", threadID, messageID);
    if (targetName === myGuildName) return api.sendMessage("❌ لا تقدر تحارب مملكتك!", threadID, messageID);
    const targetGuild = guilds[targetName];
    if (!targetGuild) return api.sendMessage(`❌ لا توجد مملكة باسم "${targetName}"`, threadID, messageID);
    if (targetGuild.warWith) return api.sendMessage(`❌ مملكة "${targetName}" في حرب بالفعل`, threadID, messageID);

    myGuild.warWith    = targetName;
    myGuild.warScore   = { us: 0, them: 0, battles: 0 };
    targetGuild.warWith  = myGuildName;
    targetGuild.warScore = { us: 0, them: 0, battles: 0 };

    guilds[myGuildName] = myGuild;
    guilds[targetName]  = targetGuild;
    saveGuilds(guilds);

    return api.sendMessage(
      `⚔️ إعلان حرب!\n\n👑 مملكة ${myGuildName}\n⚡ VS ⚡\n👑 مملكة ${targetName}\n\nالحرب بدأت! كل انتصار لعضو من مملكتك يُضاف لنقاط مملكتك في الحرب\nأول مملكة تصل لـ 10 انتصارات تفوز!\n\nنقاط: مملكة حرب نقاط`,
      threadID
    );
  }

  // ── نقاط الحرب ──
  if (sub === "حرب" && args[1] === "نقاط") {
    if (!myGuild?.warWith) return api.sendMessage("❌ مملكتك ليست في حرب", threadID, messageID);
    return api.sendMessage(
      `⚔️ نقاط حرب ${myGuildName} ضد ${myGuild.warWith}\n\n` +
      `🔵 ${myGuildName}: ${myGuild.warScore?.us || 0} نقطة\n` +
      `🔴 ${myGuild.warWith}: ${myGuild.warScore?.them || 0} نقطة\n\n` +
      `أول مملكة تصل لـ 10 تفوز`,
      threadID, messageID
    );
  }

  return api.sendMessage(
    `❓ أمر غير معروف\nاكتب: مملكة — لعرض القائمة الكاملة`,
    threadID, messageID
  );
};
