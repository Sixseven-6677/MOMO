const koniyatIntervals = global.koniyatIntervals || (global.koniyatIntervals = new Map());

module.exports.config = {
  name: "كنيات",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "PARADISE",
  description: "تغيير كنيات جميع أعضاء الكروب واحداً واحداً كل 5 ثوانٍ",
  commandCategory: "أوامر",
  usages: "[الاسم] | توقف",
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

  if (!args[0]) {
    return api.sendMessage("اكتب الاسم الذي تريد تعيينه\nمثال: كنيات 𝑷𝑨𝑹𝑨𝑫𝑰𝑺𝑬", threadID, messageID);
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
