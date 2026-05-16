module.exports.config = {
    name: "joinNoti",
    eventType: ["log:subscribe"],
    version: "2.0.0",
    credits: "TatsuYTB / updated by MOMO",
    description: "إشعار دخول عضو للمجموعة بصورة"
};

module.exports.run = async function({ api, event, Users }) {
    const { threadID, logMessageData } = event;
    const os   = require('os');
    const path = require('path');
    const fs   = require('fs');
    const moment = require('moment-timezone');

    const botID = api.getCurrentUserID();
    const botAdded = logMessageData.addedParticipants.some(p => p.userFbId == botID);

    if (botAdded) {
        await api.changeNickname(
            `[ ${global.config.PREFIX} ] • ${global.config.BOTNAME || "Bot"}`,
            threadID,
            botID
        );
        return api.sendMessage(`[𝐊𝐞̂́𝐭 𝐍𝐨̂́𝐢 𝐓𝐡𝐚̀𝐧𝐡 𝐂𝐨̂𝐧𝐠]`, threadID);
    }

    const nameArray = [];
    for (const p of logMessageData.addedParticipants) {
        if (p.userFbId == botID) continue;
        const userName = p.fullName;
        nameArray.push({ uid: p.userFbId, name: userName });
        if (!global.data.allUserID.includes(p.userFbId)) {
            await Users.createData(p.userFbId, { name: userName, data: {} });
            global.data.userName.set(p.userFbId, userName);
            global.data.allUserID.push(p.userFbId);
        }
    }
    if (nameArray.length === 0) return;

    const threadInfo  = await api.getThreadInfo(threadID);
    const authorData  = await Users.getData(event.author);
    const authorName  = authorData?.name || "Link Join";
    const memberCount = threadInfo.participantIDs.length;
    const threadName  = threadInfo.threadName || "—";

    const time = moment().tz("Asia/Riyadh").format("DD/MM/YYYY HH:mm");

    for (const { uid, name } of nameArray) {
        const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=300&height=300&type=large`;
        let imgPath;
        try {
            const { makeJoinCard } = require('../../utils/makeJoinCard');
            const buf = await makeJoinCard({ name, threadName, memberCount, author: authorName, avatarUrl });
            imgPath = path.join(os.tmpdir(), `join_${Date.now()}.png`);
            fs.writeFileSync(imgPath, buf);
            await new Promise((resolve, reject) => {
                api.sendMessage(
                    { attachment: fs.createReadStream(imgPath) },
                    threadID,
                    (err) => {
                        if (imgPath) try { fs.unlinkSync(imgPath); } catch(e) {}
                        if (err) reject(err); else resolve();
                    }
                );
            });
        } catch (err) {
            if (imgPath) try { fs.unlinkSync(imgPath); } catch(e) {}
            api.sendMessage(
                `✅ مرحباً ${name}!\n📌 المجموعة: ${threadName}\n👥 عضو رقم: ${memberCount}\n➕ أضافه: ${authorName}`,
                threadID
            );
        }
    }
};
