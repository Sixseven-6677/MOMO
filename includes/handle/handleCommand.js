module.exports = function ({ api, models, Users, Threads, Currencies }) {
  const fs = require("fs");
  const logger = require("../../utils/log.js");
  const axios = require('axios');
  const path = require('path');
  const moment = require("moment-timezone");
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return async function ({ event }) {
    const dateNow = Date.now();
    const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
    const times = process.uptime(), hours = Math.floor(times / (60 * 60)), minutes = Math.floor((times % (60 * 60)) / 60), seconds = Math.floor(times % 60);

    const { allowInbox, PREFIX, ADMINBOT, NDH, DeveloperMode, adminOnly, keyAdminOnly, ndhOnly, adminPaseOnly } = global.config;
    const { userBanned, threadBanned, threadInfo, threadData, commandBanned } = global.data;
    const { commands, cooldowns } = global.client;
    var { body, senderID, threadID, messageID } = event;
    var senderID = String(senderID), threadID = String(threadID);

    const threadSetting = threadData.get(threadID) || {};
    const prefixRegex = new RegExp(`^(<@!?${senderID}>|${escapeRegex((threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : PREFIX)})\\s*`);
    if (!prefixRegex.test(body)) return;

    const adminbot = require('./../../config.json');
    let usgPath = __dirname + '/usages.json';
    if (!fs.existsSync(usgPath)) fs.writeFileSync(usgPath, JSON.stringify({}));
    let usages = JSON.parse(fs.readFileSync(usgPath));

    if (!global.data.allThreadID.includes(threadID) && !ADMINBOT.includes(senderID) && adminbot.adminPaseOnly == true) {
      return api.sendMessage("هذا الأمر غير متاح في المحادثة الخاصة", threadID, messageID);
    }
    if (!ADMINBOT.includes(senderID) && adminbot.adminOnly == true) {
      return api.sendMessage('أدمن البوت فقط يقدر يستخدم البوت', threadID, messageID);
    }
    if (!ADMINBOT.includes(senderID) && global.config.ignoreNonAdmin == true) return;
    if (global.config.totalSilence == true) {
      if (!ADMINBOT.includes(senderID)) return;
      const silentBody = body.slice((body.match(prefixRegex)[0] || "").length).trim();
      const isToggleOff = /^(تجاهل\s+كلي\s+توقف|اغلاق\s+تعطيل|اغلاق\s+توقف)\s*$/.test(silentBody);
      if (!isToggleOff) return;
    }
    if (!NDH.includes(senderID) && !ADMINBOT.includes(senderID) && adminbot.ndhOnly == true) {
      return api.sendMessage('NDH مجموعة المطورين فقط يقدرون يستخدمون البوت', threadID, messageID);
    }

    // FIX 1: Reload data.json fresh each time (not cached by require) to get latest adminbox state
    let dataAdbox = { adminbox: {} };
    try {
      const dataAdboxPath = path.resolve(__dirname, './../../modules/commands/cache/data.json');
      dataAdbox = JSON.parse(fs.readFileSync(dataAdboxPath, 'utf8'));
    } catch (e) {}

    // FIX 2: Guard against threadInfo returning {} (truthy empty object with no adminIDs)
    let threadInf = threadInfo.get(threadID);
    if (!threadInf || !threadInf.adminIDs) {
      try { threadInf = await Threads.getInfo(threadID); } catch(e) { threadInf = { adminIDs: [] }; }
    }
    const findd = (threadInf.adminIDs || []).find(el => el.id == senderID);

    if (dataAdbox.adminbox && dataAdbox.adminbox.hasOwnProperty(threadID) && dataAdbox.adminbox[threadID] == true && !ADMINBOT.includes(senderID) && !findd && event.isGroup == true && !NDH.includes(senderID)) {
      return api.sendMessage('أدمن الكروب فقط يقدر يستخدم البوت هنا', event.threadID, event.messageID);
    }

    if (userBanned.has(senderID) || threadBanned.has(threadID) || allowInbox == ![] && senderID == threadID) {
      if (!ADMINBOT.includes(senderID.toString()) && !NDH.includes(senderID.toString())) {
        if (userBanned.has(senderID)) {
          const { reason, dateAdded } = userBanned.get(senderID) || {};
          return api.sendMessage(global.getText("handleCommand", "userBanned", reason, dateAdded), threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }, messageID);
        } else {
          if (threadBanned.has(threadID)) {
            const { reason, dateAdded } = threadBanned.get(threadID) || {};
            return api.sendMessage(global.getText("handleCommand", "threadBanned", reason, dateAdded), threadID, async (err, info) => {
              await new Promise(resolve => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            }, messageID);
          }
        }
      }
    }

    const [matchedPrefix] = body.match(prefixRegex),
      args = body.slice(matchedPrefix.length).trim().split(/ +/);
    let commandName = args.shift().toLowerCase();
    var command = commands.get(commandName);
    fs.writeFileSync(usgPath, JSON.stringify(usages, null, 4));

    if (!command) return;

    // ── فحص قفل الأمر بالغروب ────────────────────────────────────────────
    if (global.lockedCmds && global.lockedCmds.has(threadID)) {
      const locked = global.lockedCmds.get(threadID);
      if (locked.has(commandName) && !ADMINBOT.includes(senderID))
        return api.sendMessage('🔒 الأمر "' + commandName + '" مقفل في هذا الغروب', threadID);
    }

    // ── فحص الإغلاق الكلي — يمنع كل الأوامر بعد تفعيله ──────────────────
    if (global.ighlaqData && global.ighlaqData.get(threadID) === "full") {
      // الأدمن: يُسمح فقط بأمر "اغلاق تعطيل" أو "اغلاق توقف"
      if (ADMINBOT.includes(senderID)) {
        const isDeactivate = (commandName === "اغلاق" && (args[0] === "تعطيل" || args[0] === "توقف")) || commandName === "فتح";
        if (!isDeactivate) return;
      } else {
        return; // الجميع: صمت تام
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    if (commandBanned.get(threadID) || commandBanned.get(senderID)) {
      if (!ADMINBOT.includes(senderID)) {
        const banThreads = commandBanned.get(threadID) || [],
          banUsers = commandBanned.get(senderID) || [];
        if (banThreads.includes(command.config.name))
          return api.sendMessage(global.getText("handleCommand", "commandThreadBanned", command.config.name), threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }, messageID);
        if (banUsers.includes(command.config.name))
          return api.sendMessage(global.getText("handleCommand", "commandUserBanned", command.config.name), threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }, messageID);
      }
    }

    if (command.config.commandCategory && command.config.commandCategory.toLowerCase() == 'nsfw' && !global.data.threadAllowNSFW.includes(threadID) && !ADMINBOT.includes(senderID))
      return api.sendMessage(global.getText("handleCommand", "threadNotAllowNSFW"), threadID, async (err, info) => {
        await new Promise(resolve => setTimeout(resolve, 5 * 1000));
        return api.unsendMessage(info.messageID);
      }, messageID);

    var threadInfo2;
    if (event.isGroup == !![])
      try {
        threadInfo2 = (threadInfo.get(threadID) || await Threads.getInfo(threadID));
        if (Object.keys(threadInfo2).length == 0) throw new Error();
      } catch (err) {
        logger(global.getText("handleCommand", "cantGetInfoThread", "error"));
      }

    var permssion = 0;
    // FIX 3: Guard against threadInfoo.adminIDs being undefined (same root cause as FIX 2)
    let threadInfoo = threadInfo.get(threadID);
    if (!threadInfoo || !threadInfoo.adminIDs) {
      try { threadInfoo = await Threads.getInfo(threadID); } catch(e) { threadInfoo = { adminIDs: [] }; }
    }
    const find = (threadInfoo.adminIDs || []).find(el => el.id == senderID);
    if (ADMINBOT.includes(senderID.toString())) permssion = 3;
    else if (NDH.includes(senderID.toString())) permssion = 2;
    else if (!ADMINBOT.includes(senderID) && find) permssion = 1;

    var quyenhan = "";
    if (command.config.hasPermssion == 1) quyenhan = "أدمن الكروب";
    else if (command.config.hasPermssion == 2) quyenhan = "مطور البوت";
    else if (command.config.hasPermssion == 3) quyenhan = "أدمن البوت";

    if (command.config.hasPermssion > permssion)
      return api.sendMessage(`❌ هذا الأمر (${command.config.name}) يتطلب: ${quyenhan}`, event.threadID, event.messageID);

    if (!global.client.cooldowns.has(command.config.name)) global.client.cooldowns.set(command.config.name, new Map());
    const timestamps = global.client.cooldowns.get(command.config.name);
    const expirationTime = (command.config.cooldowns || 1) * 1000;
    if (timestamps.has(senderID) && dateNow < timestamps.get(senderID) + expirationTime)
      return api.setMessageReaction('⏳', event.messageID, err => {}, true);

    var getText2;
    if (command.languages && typeof command.languages == 'object' && command.languages.hasOwnProperty(global.config.language))
      getText2 = (...values) => {
        var lang = command.languages[global.config.language][values[0]] || '';
        for (var i = values.length; i > 1; i--) {
          const expReg = RegExp('%' + i, 'g');
          lang = lang.replace(expReg, values[i]);
        }
        return lang;
      };
    else getText2 = () => { };

    try {
      const Obj = {};
      Obj.api = api;
      Obj.event = event;
      Obj.args = args;
      Obj.models = models;
      Obj.Users = Users;
      Obj.Threads = Threads;
      Obj.Currencies = Currencies;
      Obj.permssion = permssion;
      Obj.getText = getText2;
      usages = JSON.parse(fs.readFileSync(usgPath));
      fs.writeFileSync(usgPath, JSON.stringify(usages, null, 4));
      // ── Typing Indicator via MQTT ──────────────────────────────────────
      try {
        if (global.mqttClient && global.mqttClient.connected) {
          const typPayload = JSON.stringify({
            state: 1,
            thread: threadID,
            sender_fbid: api.getCurrentUserID ? api.getCurrentUserID() : ''
          });
          global.mqttClient.publish('/orca_typing_notifications', typPayload, { qos: 0 });
        }
      } catch(e) {}
      await new Promise(r => setTimeout(r, 700));
      command.run(Obj);
      timestamps.set(senderID, dateNow);
      if (DeveloperMode == !![])
        logger(global.getText("handleCommand", "executeCommand", time, commandName, senderID, threadID, args.join(" "), (Date.now()) - dateNow), "MODE");
      return;
    } catch (e) {
      return api.sendMessage(global.getText("handleCommand", "commandError", commandName, e), threadID);
    }
  };
};
