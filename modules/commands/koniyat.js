const koniyatIntervals = global.koniyatIntervals || (global.koniyatIntervals = new Map());

module.exports.config = {
  name: "كنيات",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "PARADISE",
  description: "تغيير/حذف كنيات جميع أعضاء الكروب",
  commandCategory: "أوامر",
  usages: "كنيات [الاسم] | كنيات حذف | كنيات توقف",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (args[0] === "توقف") {
    if (koniyatIntervals.has(threadID)) {
      clearTimeout(koniyatIntervals.get(threadID));
      koniyatIntervals.delete(threadID);
      return api.sendMessage("تم إيقاف تغيير الكنيات ✅", threadID, messageID);
    }
    return api.sendMessage("ما في شيء شغال أصلاً", threadID, messageID);
  }

  if (args[0] === "حذف") {
    if (koniyatIntervals.has(threadID)) {
      clearTimeout(koniyatIntervals.get(threadID));
      koniyatIntervals.delete(threadID);
    }

    let members;
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      members = threadInfo.participantIDs;
    } catch (e) {
      return api.sendMessage("❌ ما قدرت أجيب أعضاء الكروب", threadID, messageID);
    }

    api.sendMessage(
      `🧹 بدأ حذف كنيات الجميع (${members.length} عضو)\nكل ثانية يتم مسح كنية واحدة\nللإيقاف: كنيات توقف`,
      threadID, messageID
    );

    let i = 0;
    const clearNext = () => {
      if (!koniyatIntervals.has(threadID)) return;
      if (i >= members.length) {
        koniyatIntervals.delete(threadID);
        api.sendMessage("✅ تم حذف كنيات جميع الأعضاء", threadID);
        return;
      }
      api.changeNickname("", threadID, members[i]);
      i++;
      const t = setTimeout(clearNext, 1000);
      koniyatIntervals.set(threadID, t);
    };

    const t = setTimeout(clearNext, 100);
    koniyatIntervals.set(threadID, t);
    return;
  }

  if (!args[0]) {
    return api.sendMessage(
      "الاستخدام:\n• كنيات [الاسم] ← لتعيين كنية للجميع\n• كنيات حذف ← لمسح كنيات الجميع\n• كنيات توقف ← لإيقاف العملية الحالية",
      threadID, messageID
    );
  }

  const name = args.join(" ");

  if (koniyatIntervals.has(threadID)) {
    clearTimeout(koniyatIntervals.get(threadID));
    koniyatIntervals.delete(threadID);
  }

  api.sendMessage(`✅ بدأ تغيير الكنيات إلى: ${name}\nكل ثانية سيتم تغيير كنية واحدة\nللإيقاف: كنيات توقف`, threadID, messageID);

  const threadInfo = await api.getThreadInfo(threadID);
  const members = threadInfo.participantIDs;
  let index = 0;

  const changeNext = () => {
    if (!koniyatIntervals.has(threadID)) return;
    if (index >= members.length) index = 0;
    api.changeNickname(name, threadID, members[index]);
    index++;
    const t = setTimeout(changeNext, 1000);
    koniyatIntervals.set(threadID, t);
  };

  const t = setTimeout(changeNext, 100);
  koniyatIntervals.set(threadID, t);
};
