module.exports.config = {
    name: "guard",
    eventType: ["log:thread-admins"],
    version: "1.1.0",
    credits: "D-Jukie + XAVIER",
    description: "Ngăn chặn việc thay đổi admin (يتجاهل ادمن البوت)",
};

module.exports.run = async function ({ event, api, Threads, Users }) {
    const { logMessageType, logMessageData, senderID } = event;
    let data = (await Threads.getData(event.threadID)).data;
    if (!data || data.guard !== true) return;

    const ADMINBOT = (global.config && global.config.ADMINBOT) || [];
    const authorStr = String(event.author);
    if (ADMINBOT.map(String).includes(authorStr)) return;

    if (logMessageType !== "log:thread-admins") return;

    const targetStr = String(logMessageData.TARGET_ID);
    const botID = String(api.getCurrentUserID());

    if (logMessageData.ADMIN_EVENT == "add_admin") {
        if (authorStr === botID) return;
        if (targetStr === botID) return;
        if (ADMINBOT.map(String).includes(targetStr)) return;
        api.changeAdminStatus(event.threadID, event.author, false, editAdminsCallback);
        api.changeAdminStatus(event.threadID, logMessageData.TARGET_ID, false);
        function editAdminsCallback(err) {
            if (err) return api.sendMessage("→ 𝐇𝐢𝐡𝐢𝐡𝐢𝐡𝐢𝐡! ", event.threadID, event.messageID);
            return api.sendMessage(`→ 𝐊𝐢́𝐜𝐡 𝐡𝐨𝐚̣𝐭 𝐜𝐡𝐞̂́ đ𝐨̣̂ 𝐜𝐡𝐨̂́𝐧𝐠 𝐜𝐮̛𝐨̛́𝐩 𝐛𝐨𝐱`, event.threadID, event.messageID);
        }
    } else if (logMessageData.ADMIN_EVENT == "remove_admin") {
        if (authorStr === botID) return;
        if (targetStr === botID) return;
        if (ADMINBOT.map(String).includes(targetStr)) return;
        api.changeAdminStatus(event.threadID, event.author, false, editAdminsCallback);
        api.changeAdminStatus(event.threadID, logMessageData.TARGET_ID, true);
        function editAdminsCallback(err) {
            if (err) return api.sendMessage("→ 𝐇𝐢𝐡𝐢𝐡𝐢𝐡𝐢𝐡! ", event.threadID, event.messageID);
            return api.sendMessage(`→ 𝐊𝐢́𝐜𝐡 𝐡𝐨𝐚̣𝐭 𝐜𝐡𝐞̂́ đ𝐨̣̂ 𝐜𝐡𝐨̂́𝐧𝐠 𝐜𝐮̛𝐨̛́𝐩 𝐛𝐨𝐱`, event.threadID, event.messageID);
        }
    }
};
