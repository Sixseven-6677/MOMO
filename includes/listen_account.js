/**
 * listen_account.js
 * Lightweight listener for additional accounts (multi-account support).
 * Reuses all existing command/event handlers without re-initializing the DB.
 */
module.exports = function({ api, models }) {
  const logger = require("../utils/log.js");

  let Users, Threads, Currencies;
  try {
    Users = require("./controllers/users")({ models, api });
    Threads = require("./controllers/threads")({ models, api });
    Currencies = require("./controllers/currencies")({ models });
  } catch (e) {
    logger(`[listen_account] Failed to load controllers: ${e.message}`, "error");
    return async () => {};
  }

  let handleCommand, handleCommandEvent, handleReply, handleReaction, handleEvent, handleCreateDatabase;
  try {
    handleCommand = require("./handle/handleCommand")({ api, models, Users, Threads, Currencies });
    handleCommandEvent = require("./handle/handleCommandEvent")({ api, models, Users, Threads, Currencies });
    handleReply = require("./handle/handleReply")({ api, models, Users, Threads, Currencies });
    handleReaction = require("./handle/handleReaction")({ api, models, Users, Threads, Currencies });
    handleEvent = require("./handle/handleEvent")({ api, models, Users, Threads, Currencies });
    handleCreateDatabase = require("./handle/handleCreateDatabase")({ api, Threads, Users, Currencies, models });
  } catch (e) {
    logger(`[listen_account] Failed to load handlers: ${e.message}`, "error");
    return async () => {};
  }

  return async (event) => {
    try {
      if (event.type === "change_thread_image") {
        api.sendMessage(`» [ 𝐂𝐀̣̂𝐏 𝐍𝐇𝐀̣̂𝐓 𝐍𝐇𝐎́𝐌 ]\n»  ${event.snippet}`, event.threadID);
      }

      switch (event.type) {
        case "message":
        case "message_reply":
        case "message_unsend":
          handleCreateDatabase({ event });
          handleCommand({ event });
          handleReply({ event });
          handleCommandEvent({ event });
          break;

        case "change_thread_image":
        case "event":
          handleEvent({ event });
          handleCommandEvent({ event });
          break;

        case "message_reaction": {
          const { iconUnsend } = global.config || {};
          if (
            iconUnsend && iconUnsend.status &&
            event.senderID == api.getCurrentUserID() &&
            event.reaction == iconUnsend.icon
          ) {
            api.unsendMessage(event.messageID);
          }
          handleReaction({ event });
          break;
        }

        default:
          break;
      }
    } catch (e) {
      logger(`[listen_account] Error handling event: ${e.message}`, "error");
    }
  };
};
