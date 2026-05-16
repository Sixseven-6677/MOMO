module.exports = function ({ api, models }) {
  setInterval(function () {
    if(global.config.NOTIFICATION) {
      require("./handle/handleNotification.js")({ api });
    }
  }, 1000*60);
    const fs = require("fs");
    const Users = require("./controllers/users")({ models, api }),
        Threads = require("./controllers/threads")({ models, api }),
        Currencies = require("./controllers/currencies")({ models });
    const logger = require("../utils/log.js");
    const moment = require('moment-timezone');
    const axios = require("axios");
    var day = moment.tz("Asia/Ho_Chi_Minh").day();


    const checkttDataPath = __dirname + '/../modules/commands/tuongtac/checktt/';
    setInterval(async () => {
        const day_now = moment.tz("Asia/Ho_Chi_Minh").day();
        const _ADMINIDs = [...global.config.NDH, ...global.config.ADMINBOT];
      try {
        if (day != day_now) {
            day = day_now;
            const checkttData = fs.readdirSync(checkttDataPath).filter(file => {
              const _ID = file.replace('.json', '');
              return _ADMINIDs.includes(_ID) || global.data.allThreadID.includes(_ID);
            });
            console.log('Bắt đầu kiểm tra tương tác ngày mới');
            await new Promise(async resolve => {
                for (const checkttFile of checkttData) {
                    const checktt = JSON.parse(fs.readFileSync(checkttDataPath + checkttFile));
                    let storage = [], count = 1;
                    for (const item of checktt.day) {
                        const userName = await Users.getNameUser(item.id) || 'Tên không tồn tại';
                        const itemToPush = item;
                        itemToPush.name = userName;
                        storage.push(itemToPush);
                    };
                    storage.sort((a, b) => {
                        if (a.count > b.count) {
                            return -1;
                        }
                        else if (a.count < b.count) {
                            return 1;
                        } else {
                            return a.name.localeCompare(b.name);
                        }
                    });
                    let checkttBody = '»𝗧𝗢𝗣 𝗧𝗨̛𝗢̛𝗡𝗚 𝗧𝗔́𝗖 𝗡𝗚𝗔̀𝗬«\n\n';
                    checkttBody += storage.slice(0, 10).map(item => {
                        return `${count++}. ${item.name} (${item.count})`;
                    }).join('\n');
                    api.sendMessage(checkttBody, checkttFile.replace('.json', ''), (err) => err ? console.log(err) : '');

                    checktt.day.forEach(e => {
                        e.count = 0;
                    });
                    checktt.time = day_now;
                    fs.writeFileSync(checkttDataPath + checkttFile, JSON.stringify(checktt, null, 4));
                }
                resolve();
            })

            await new Promise(async resolve => {
                if (day_now == 1) {
                    console.log('Bắt đầu kiểm tra tương tác tuần mới');
                    for (const checkttFile of checkttData) {
                        const checktt = JSON.parse(fs.readFileSync(checkttDataPath + checkttFile));
                        let storage = [], count = 1;
                        for (const item of checktt.week) {
                            const userName = await Users.getNameUser(item.id) || 'Tên không tồn tại';
                            const itemToPush = item;
                            itemToPush.name = userName;
                            storage.push(itemToPush);
                        };
                        storage.sort((a, b) => {
                            if (a.count > b.count) {
                                return -1;
                            }
                            else if (a.count < b.count) {
                                return 1;
                            } else {
                                return a.name.localeCompare(b.name);
                            }
                        });
                        let checkttBody = '»𝗧𝗢𝗣 𝗧𝗨̛𝗢̛𝗡𝗚 𝗧𝗔́𝗖 𝗧𝗨𝗔̂̀𝗡«\n\n';
                        checkttBody += storage.slice(0, 10).map(item => {
                            return `${count++}. ${item.name} (${item.count})`;
                        }).join('\n');
                        api.sendMessage(checkttBody, checkttFile.replace('.json', ''), (err) => err ? console.log(err) : '');
                        checktt.week.forEach(e => {
                            e.count = 0;
                        });
                        fs.writeFileSync(checkttDataPath + checkttFile, JSON.stringify(checktt, null, 4));
                    }
                }
                resolve();
            })

            global.client.sending_top = false;
        }
      } catch(e) { console.error(e) }
    }, 1000 * 10);
    //////////////////////////////////////////////////////////////////////
    //========= Push all variable from database to environment =========//
    //////////////////////////////////////////////////////////////////////

    (async function () {

        try {
            logger(global.getText('listen', 'startLoadEnvironment'), '[ Dữ liệu ]');
            let threads = await Threads.getAll(),
                users = await Users.getAll(['userID', 'name', 'data']),
                currencies = await Currencies.getAll(['userID']);
            for (const data of threads) {
                const idThread = String(data.threadID);
                global.data.allThreadID.push(idThread),
                    global.data.threadData.set(idThread, data['data'] || {}),
                    global.data.threadInfo.set(idThread, data.threadInfo || {});
                if (data['data'] && data['data']['banned'] == !![])
                    global.data.threadBanned.set(idThread,
                        {
                            'reason': data['data']['reason'] || '',
                            'dateAdded': data['data']['dateAdded'] || ''
                        });
                if (data['data'] && data['data']['commandBanned'] && data['data']['commandBanned']['length'] != 0)
                    global['data']['commandBanned']['set'](idThread, data['data']['commandBanned']);
                if (data['data'] && data['data']['NSFW']) global['data']['threadAllowNSFW']['push'](idThread);
            }
            logger.loader(global.getText('listen', 'loadedEnvironmentThread'));
            for (const dataU of users) {
                const idUsers = String(dataU['userID']);
                global.data['allUserID']['push'](idUsers);
                if (dataU.name && dataU.name['length'] != 0) global.data.userName['set'](idUsers, dataU.name);
                if (dataU.data && dataU.data.banned == 1) global.data['userBanned']['set'](idUsers, {
                    'reason': dataU['data']['reason'] || '',
                    'dateAdded': dataU['data']['dateAdded'] || ''
                });
                if (dataU['data'] && dataU.data['commandBanned'] && dataU['data']['commandBanned']['length'] != 0)
                    global['data']['commandBanned']['set'](idUsers, dataU['data']['commandBanned']);
            }
            for (const dataC of currencies) global.data.allCurrenciesID.push(String(dataC['userID']));
            logger.loader(global.getText('listen', 'loadedEnvironmentUser')), logger(global.getText('listen', 'successLoadEnvironment'), '[ Dữ liệu ]');
        } catch (error) {
            return logger.loader(global.getText('listen', 'failLoadEnvironment', error), 'error');
        }
    }());
    logger(`[ ${global.config.PREFIX} ] • ${(!global.config.BOTNAME) ? "𝙍𝘼𝙉 𝘽𝙊𝙏" : global.config.BOTNAME}`, "[ Thông tin Bot ]");

    ///////////////////////////////////////////////
    //========= Require all handle need =========//
    //////////////////////////////////////////////

    const handleCommand = require("./handle/handleCommand")({ api, models, Users, Threads, Currencies });
    const handleCommandEvent = require("./handle/handleCommandEvent")({ api, models, Users, Threads, Currencies });
    const handleReply = require("./handle/handleReply")({ api, models, Users, Threads, Currencies });
    const handleReaction = require("./handle/handleReaction")({ api, models, Users, Threads, Currencies });
  const handleRefresh = require("./handle/handleRefresh")({  api, Threads, Users, Currencies, models });
    const handleEvent = require("./handle/handleEvent")({ api, models, Users, Threads, Currencies });
    const handleCreateDatabase = require("./handle/handleCreateDatabase")({ api, Threads, Users, Currencies, models });

    //DEFINE DATLICH PATH
    const datlichPath = __dirname + "/../modules/commands/cache/data/datlich.json";

    //FUNCTION HOẠT ĐỘNG NHƯ CÁI TÊN CỦA NÓ, CRE: DUNGUWU
    const monthToMSObj = {
        1: 31 * 24 * 60 * 60 * 1000,
        2: 28 * 24 * 60 * 60 * 1000,
        3: 31 * 24 * 60 * 60 * 1000,
        4: 30 * 24 * 60 * 60 * 1000,
        5: 31 * 24 * 60 * 60 * 1000,
        6: 30 * 24 * 60 * 60 * 1000,
        7: 31 * 24 * 60 * 60 * 1000,
        8: 31 * 24 * 60 * 60 * 1000,
        9: 30 * 24 * 60 * 60 * 1000,
        10: 31 * 24 * 60 * 60 * 1000,
        11: 30 * 24 * 60 * 60 * 1000,
        12: 31 * 24 * 60 * 60 * 1000
    };
    const checkTime = (time) => new Promise((resolve) => {
        time.forEach((e, i) => time[i] = parseInt(String(e).trim()));
        const getDayFromMonth = (month) => (month == 0) ? 0 : (month == 2) ? (time[2] % 4 == 0) ? 29 : 28 : ([1, 3, 5, 7, 8, 10, 12].includes(month)) ? 31 : 30;
        if (time[1] > 12 || time[1] < 1) resolve("Tháng của bạn có vẻ không hợp lệ");
        if (time[0] > getDayFromMonth(time[1]) || time[0] < 1) resolve("Ngày của bạn có vẻ không hợp lệ");
        if (time[2] < 2022) resolve("Bạn sống ở kỷ nguyên nào thế");
        if (time[3] > 23 || time[3] < 0) resolve("Giờ của bạn có vẻ không hợp lệ");
        if (time[4] > 59 || time[3] < 0) resolve("Phút của bạn có vẻ không hợp lệ");
        if (time[5] > 59 || time[3] < 0) resolve("Giây của bạn có vẻ không hợp lệ");
        let yr = time[2] - 1970;
        let yearToMS = (yr) * 365 * 24 * 60 * 60 * 1000;
        yearToMS += ((yr - 2) / 4).toFixed(0) * 24 * 60 * 60 * 1000;
        let monthToMS = 0;
        for (let i = 1; i < time[1]; i++) monthToMS += monthToMSObj[i];
        if (time[2] % 4 == 0) monthToMS += 24 * 60 * 60 * 1000;
        let dayToMS = time[0] * 24 * 60 * 60 * 1000;
        let hourToMS = time[3] * 60 * 60 * 1000;
        let minuteToMS = time[4] * 60 * 1000;
        let secondToMS = time[5] * 1000;
        let oneDayToMS = 24 * 60 * 60 * 1000;
        let timeMs = yearToMS + monthToMS + dayToMS + hourToMS + minuteToMS + secondToMS - oneDayToMS;
        resolve(timeMs);
    });


    const tenMinutes = 10 * 60 * 1000;

    const checkAndExecuteEvent = async () => {

        /*smol check*/
        if (!fs.existsSync(datlichPath)) fs.writeFileSync(datlichPath, JSON.stringify({}, null, 4));
        var data = JSON.parse(fs.readFileSync(datlichPath));

        //GET CURRENT TIME
        var timeVN = moment().tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY_HH:mm:ss');
        timeVN = timeVN.split("_");
        timeVN = [...timeVN[0].split("/"), ...timeVN[1].split(":")];

        let temp = [];
        let vnMS = await checkTime(timeVN);
        const compareTime = (boxID, e) => new Promise(async (resolve) => {
            let getTimeMS = await checkTime(e.split("_"));
            if (getTimeMS < vnMS) {
                if (vnMS - getTimeMS < tenMinutes) {
                    data[boxID][e]["TID"] = boxID;
                    temp.push(data[boxID][e]); delete data[boxID][e];
                } else delete data[boxID][e];
                fs.writeFileSync(datlichPath, JSON.stringify(data, null, 4));
            };
            resolve();
        })

        await new Promise(async (resolve) => {
            for (let boxID in data) {
                for (let e of Object.keys(data[boxID])) await compareTime(boxID, e);
            }
            resolve();
        })
        for (let el of temp) {
            try {
                var all = (await Threads.getInfo(el["TID"])).participantIDs;
                all.splice(all.indexOf(api.getCurrentUserID()), 1);
                var body = el.REASON || "🥰🥰🥰", mentions = [], index = 0;

                for (let i = 0; i < all.length; i++) {
                    if (i == body.length) body += " ‍ ";
                    mentions.push({
                        tag: body[i],
                        id: all[i],
                        fromIndex: i - 1
                    });
                }
            } catch (e) { return console.log(e); }
            var out = {
                body, mentions
            }
            if ("ATTACHMENT" in el) {
                out.attachment = [];
                for (let a of el.ATTACHMENT) {
                    let getAttachment = (await axios.get(encodeURI(a.url), { responseType: "arraybuffer" })).data;
                    fs.writeFileSync(__dirname + `/../modules/commands/cache/${a.fileName}`, Buffer.from(getAttachment, 'utf-8'));
                    out.attachment.push(fs.createReadStream(__dirname + `/../modules/commands/cache/${a.fileName}`));
                }
            }
            console.log(out);
            if ("BOX" in el) await api.setTitle(el["BOX"], el["TID"]);
            api.sendMessage(out, el["TID"], () => ("ATTACHMENT" in el) ? el.ATTACHMENT.forEach(a => fs.unlinkSync(__dirname + `/../modules/commands/cache/${a.fileName}`)) : "");
        }

    }
    setInterval(checkAndExecuteEvent, tenMinutes / 10);
    //////////////////////////////////////////////////
    //========= Send event to handle need =========//
    /////////////////////////////////////////////////

    function _pushEvent(type, user, detail) {
        try {
            if (!global.client.recentEvents) global.client.recentEvents = [];
            global.client.recentEvents.unshift({ type, user, detail, time: Date.now() });
            if (global.client.recentEvents.length > 30) global.client.recentEvents.pop();
        } catch(e) {}
    }

    return async (event) => {

        if (event.type == "change_thread_image") api.sendMessage(`» [ 𝐂𝐀̣̂𝐏 𝐍𝐇𝐀̣̂𝐓 𝐍𝐇𝐎́𝐌 ]\n»  ${event.snippet}`, event.threadID);
        switch (event.type) {
            case "message":
            case "message_reply":
            case "message_unsend":
                handleCreateDatabase({ event });
                handleCommand({ event });
                handleReply({ event });
                handleCommandEvent({ event });
                if (event.body && event.body.startsWith(global.config.PREFIX)) {
                    const cmdName = event.body.slice(global.config.PREFIX.length).split(' ')[0].toLowerCase();
                    _pushEvent('cmd', String(event.senderID), cmdName);
                }
                break;
            case "change_thread_image":
            case "event":
                if (event.logMessageType === 'log:subscribe')
                    _pushEvent('join', String(event.logMessageData?.addedParticipants?.[0]?.userFbId || event.author), '');
                if (event.logMessageType === 'log:unsubscribe')
                    _pushEvent('leave', String(event.logMessageData?.leftParticipantFbId || event.author), '');
                handleEvent({ event });
                handleCommandEvent({ event });
                handleRefresh({ event });
                if (event.type != "change_thread_image" && global.config.notiGroup) {
          var msg = '» [ 𝐂𝐀̣̂𝐏 𝐍𝐇𝐀̣̂𝐓 𝐍𝐇𝐎́𝐌 ]\n» '
          msg += event.logMessageBody
          if(event.author == api.getCurrentUserID()) {
            msg = msg.replace('Bạn ', global.config.BOTNAME)
          }
          api.sendMessage(msg, event.threadID);
        }
                break;
            case "message_reaction":
              var { iconUnsend } = global.config
              if(iconUnsend.status && event.senderID == api.getCurrentUserID() && event.reaction == iconUnsend.icon) {
                api.unsendMessage(event.messageID)
              }
              handleReaction({ event });
              break;
            default:
              break;
        }
    };
};