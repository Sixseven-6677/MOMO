module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");
    return async function ({ event }) {
        const { threadID, logMessageType, logMessageData } = event;
        const { setData, getData, delData, createData } = Threads;
        try {
            let dataThread = (await getData(threadID)).threadInfo;
            switch (logMessageType) {
                case "log:thread-admins": {
                    if (logMessageData.ADMIN_EVENT == "add_admin") {
                        dataThread.adminIDs.push({
                            id: logMessageData.TARGET_ID
                        })
                    } else if (logMessageData.ADMIN_EVENT == "remove_admin") {
                        dataThread.adminIDs = dataThread.adminIDs.filter(item => item.id != logMessageData.TARGET_ID);
                    }
                    logger('Làm mới list admin tại nhóm ' + threadID, 'UPDATE DATA')
                    await setData(threadID, { threadInfo: dataThread });
                    break;
                }
                case "log:thread-name": {
                    logger('Cập nhật tên tại nhóm ' + threadID, 'UPDATE DATA')
                    dataThread.threadName = event.logMessageData.name
                    await setData(threadID, { threadInfo: dataThread });
                    break;
                }
                case "log:subscribe": {
                    // BUG FIX: removed broken require('./handleCreateDatabase.js') that loaded
                    // the factory function but never called it — DB is created automatically
                    // by handleCreateDatabase in listen.js on the next message event.
                    break;
                }
                
                case 'log:unsubscribe': {
                    if (logMessageData.leftParticipantFbId == api.getCurrentUserID()) {
                        logger('Thực hiện xóa data của nhóm ' + threadID, 'DELETE DATA')
                        const index = global.data.allThreadID.findIndex(item => item == threadID);
                        global.data.allThreadID.splice(index, 1);
                        await delData(threadID);
                        return
                    } else {
                        const index = dataThread.participantIDs.findIndex(item => item == logMessageData.leftParticipantFbId);
                        dataThread.participantIDs.splice(index, 1);
                        if (dataThread.adminIDs.find(i => i.id == logMessageData.leftParticipantFbId)) {
                            dataThread.adminIDs = dataThread.adminIDs.filter(item => item.id != logMessageData.leftParticipantFbId);
                        }
                        logger('Thực hiện xóa user ' + logMessageData.leftParticipantFbId, 'DELETE DATA')
                        await setData(threadID, { threadInfo: dataThread });
                    }
                    break;
                }
            }
        } catch (e) {
            console.log('Đã xảy ra lỗi update data: ' + e)
        }
        return;
    };
}