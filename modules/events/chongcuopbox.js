module.exports.config = {
    name: "guard",
    eventType: ["log:thread-admins"],
    version: "1.0.1",
    credits: "D-Jukie",
    description: "Ngăn chặn việc thay đổi admin",
};

module.exports.run = async function ({ event, api, Threads }) {
    const { logMessageType, logMessageData } = event;

    // BUG FIX: add fallback {} to prevent crash when thread data is null
    let data = ((await Threads.getData(event.threadID)).data) || {};
    if (data.guard == false || !data.guard) return;

    if (data.guard == true) {
        switch (logMessageType) {
          case "log:thread-admins": {
            if (logMessageData.ADMIN_EVENT == "add_admin") {
              if (event.author == api.getCurrentUserID()) return;
              if (logMessageData.TARGET_ID == api.getCurrentUserID()) return;
              api.changeAdminStatus(event.threadID, event.author, false, (err) => {
                if (err) return api.sendMessage("→ 𝐇𝐢𝐡𝐢𝐡𝐢𝐡𝐢𝐡! ", event.threadID);
                return api.sendMessage("→ 𝐊𝐢́𝐜𝐡 𝐡𝐨𝐚̣𝐭 𝐜𝐡𝐞̂́ đ𝐨̣̂ 𝐜𝐡𝐨̂́𝐧𝐠 𝐜𝐮̛𝐨̛́𝐩 𝐛𝐨𝐱", event.threadID);
              });
              api.changeAdminStatus(event.threadID, logMessageData.TARGET_ID, false);
            } else if (logMessageData.ADMIN_EVENT == "remove_admin") {
              if (event.author == api.getCurrentUserID()) return;
              if (logMessageData.TARGET_ID == api.getCurrentUserID()) return;
              api.changeAdminStatus(event.threadID, event.author, false, (err) => {
                if (err) return api.sendMessage("→ 𝐇𝐢𝐡𝐢𝐡𝐢𝐡𝐢𝐡! ", event.threadID);
                return api.sendMessage("→ 𝐊𝐢́𝐜𝐡 𝐡𝐨𝐚̣𝐭 𝐜𝐡𝐞̂́ đ𝐨̣̂ 𝐜𝐡𝐨̂́𝐧𝐠 𝐜𝐮̛𝐨̛́𝐩 𝐛𝐨𝐱", event.threadID);
              });
              api.changeAdminStatus(event.threadID, logMessageData.TARGET_ID, true);
            }
            break;
          }
        }
    }
};
