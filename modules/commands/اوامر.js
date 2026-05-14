module.exports.config = {
  name: "اوامر",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "FANG",
  description: "عرض جميع الأوامر المتاحة مجمّعة حسب الفئة",
  commandCategory: "معلومات",
  usages: "اوامر | اوامر [اسم الأمر]",
  cooldowns: 5
};

const PERM_LABELS = {
  0: "",
  1: " 🔒أدمن غروب",
  2: " 🔐مطوّر",
  3: " 👑أدمن البوت"
};

module.exports.run = async function({ api, event, args, permssion }) {
  const { threadID, messageID } = event;
  const { commands } = global.client;

  // ── عرض تفاصيل أمر واحد ─────────────────────────────────────────────────
  if (args[0]) {
    const target = args[0].trim().toLowerCase();
    const cmd = commands.get(target);
    if (!cmd) {
      return api.sendMessage(
        `❌ الأمر "${target}" غير موجود\n\nاكتب: اوامر — لرؤية جميع الأوامر`,
        threadID, messageID
      );
    }
    const c = cmd.config;
    const perm = PERM_LABELS[c.hasPermssion] || "";
    const lines = [
      `📌 أمر: ${c.name}${perm}`,
      `📝 الوصف: ${c.description || "—"}`,
      `🔧 الاستخدام: ${c.usages || c.name}`,
      `📂 الفئة: ${c.commandCategory || "عام"}`,
      `⏱ كولداون: ${c.cooldowns || 1} ثانية`,
      `📦 الإصدار: v${c.version || "1.0.0"}`
    ];
    return api.sendMessage(lines.join("\n"), threadID, messageID);
  }

  // ── عرض كل الأوامر مجمّعة ───────────────────────────────────────────────
  const userPerm = permssion || 0;

  // تجميع الأوامر حسب الفئة
  const categories = {};
  for (const [, cmd] of commands) {
    const c = cmd.config;
    // إخفاء الأوامر التي تتطلب صلاحية أعلى من صلاحية المستخدم
    // (اعرض الكل للمستخدمين العاديين لكن اشر للمقيّدة)
    const cat = c.commandCategory || "عام";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(c);
  }

  const catOrder = ["معلومات", "إدارة", "أدوات", "ذكاء اصطناعي", "ترفيه", "عام"];
  const sortedCats = [
    ...catOrder.filter(c => categories[c]),
    ...Object.keys(categories).filter(c => !catOrder.includes(c))
  ];

  const botName = global.config?.BOTNAME || "Momo";
  const total   = commands.size;

  let text = `📋 ┌── أوامر ${botName} (${total}) ──┐\n\n`;

  for (const cat of sortedCats) {
    const cmds = categories[cat];
    if (!cmds || cmds.length === 0) continue;

    const catEmoji = {
      "معلومات":      "📊",
      "إدارة":        "⚙️",
      "أدوات":        "🛠",
      "ذكاء اصطناعي": "🤖",
      "ترفيه":        "🎭",
      "عام":          "💬"
    }[cat] || "•";

    text += `${catEmoji} ${cat} (${cmds.length})\n`;

    for (const c of cmds) {
      const lock = c.hasPermssion > 0 ? ` ${["","🔒","🔐","👑"][c.hasPermssion]||"🔒"}` : "";
      text += `  • ${c.name}${lock}\n`;
    }
    text += "\n";
  }

  text += `└─────────────────────────────┘\n`;
  text += `💡 اوامر [اسم] — لتفاصيل أمر معيّن\n`;
  text += `🔒 = أدمن غروب  👑 = أدمن البوت`;

  return api.sendMessage(text, threadID, messageID);
};
