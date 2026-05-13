module.exports.config = {
  name: "leaveNoti",
  eventType: ["log:unsubscribe"],
  version: "1.0.3",
  credits: "HĐGN",
  description: "Thông báo người rời khỏi nhóm (văn bản)"
};

module.exports.run = async function ({ api, event, Users }) {
  if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;

  const threadID = event.threadID;
  const iduser = event.logMessageData.leftParticipantFbId;
  const name = global.data.userName.get(iduser) || iduser;
  const type = (event.author == iduser) ? "𝐑𝐨̛̀𝐢" : "𝐁𝐢̣ 𝐐𝐓𝐕 𝐊𝐢𝐜𝐤";

  const moment = require("moment-timezone");
  const hours = parseInt(moment.tz("Asia/Ho_Chi_Minh").format("HH"));
  const session = hours <= 10 ? "𝐒𝐚́𝐧𝐠" :
                  hours > 10 && hours <= 12 ? "𝐓𝐫𝐮̛𝐚" :
                  hours > 12 && hours <= 18 ? "𝐂𝐡𝐢𝐞̂̀𝐮" : "𝐓𝐨̂́𝐢";
  const fullYear = moment.tz("Asia/Ho_Chi_Minh").format("YYYY");
  const time = moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY || HH:mm:ss");

  const { readFileSync } = require("fs-extra");
  const { join } = require("path");
  const pathData = join(process.cwd(), "modules", "commands", "data", "leaveNoti.json");
  let dataJson = [];
  try { dataJson = JSON.parse(readFileSync(pathData, "utf-8")); } catch {}
  const thisThread = dataJson.find(i => i.threadID == threadID) || { message: null, enable: true };
  if (!thisThread.enable) return;

  let msg = thisThread.message || `𝐓𝐚̣𝐦 𝐛𝐢𝐞̣̂𝐭 {name} 𝐃̄𝐚̃ {type} 𝐊𝐡𝐨̉𝐢 𝐍𝐡𝐨́𝐦`;
  msg = msg
    .replace(/\{iduser}/g, iduser)
    .replace(/\{name}/g, name)
    .replace(/\{type}/g, type)
    .replace(/\{session}/g, session)
    .replace(/\{fullYear}/g, fullYear)
    .replace(/\{time}/g, time);

  return api.sendMessage(msg, threadID);
};
