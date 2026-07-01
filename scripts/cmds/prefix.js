const fs = require("fs-extra");
const { utils } = global; 

module.exports = {
  config: {
    name: "prefix",
    version: "2.1",
    author: "BRYAN SABIN | XENOZ",
    countDown: 5,
    role: 0,
    description: "Change le prefix du bot par chat ou global",
    category: "⚙️ Configuration",
    guide: {
      en: "╔══『 BRYAN SABIN PREFIX 』══╗\n" +
          "║ {pn} <prefix> ║ → Chat only\n" +
          "║ {pn} <prefix> -g ║ → Global | Admin\n" +
          "║ {pn} reset ║ → Default\n" +
          "╚═══════════════╝"
    }
  },

  langs: {
    en: {
      reset: "╔══『 BRYAN SABIN | RESET 』══╗\n║ ✅ Back to: %1\n╚══════════════╝",
      onlyAdmin: "╔══『 BRYAN SABIN | DENIED 』══╗\n║ ⛔ Admin Bot Only!\n╚════════╝",
      confirmGlobal: "╔══『 BRYAN SABIN | GLOBAL 』══╗\n║ ⚙️ React ✅ to confirm\n║ Change GLOBAL prefix\n╚════════════════╝",
      confirmThisThread: "╔══『 BRYAN SABIN | CHAT 』══╗\n║ ⚙️ React ✅ to confirm\n║ Change THIS chat prefix\n╚══════════════╝",
      successGlobal: "╔══『 BRYAN SABIN | UPDATED 』══╗\n║ ✅ GLOBAL: %1\n╚════════╝",
      successThisThread: "╔══『 BRYAN SABIN | UPDATED 』══╗\n║ ✅ THIS CHAT: %1\n╚════════╝",
      myPrefix: "╔══『 BRYAN SABIN | INFO 』══╗\n║ 🌍 Global: %1\n║ 💬 Chat: %2\n║\n║ ➤ Type: %3help\n╚══════════════╝"
    }
  },

  onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
    if (!args[0]) return message.SyntaxError();
    
    if (args[0] === "reset") {
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply(getLang("reset", global.GoatBot.config.prefix));
    }
    
    const newPrefix = args[0];
    const formSet = { commandName, author: event.senderID, newPrefix, setGlobal: args[1] === "-g" };
    
    if (formSet.setGlobal && role < 2) {
      return message.reply(getLang("onlyAdmin"));
    }
    
    const confirmMessage = formSet.setGlobal? getLang("confirmGlobal") : getLang("confirmThisThread");
    return message.reply(confirmMessage, (err, info) => {
      formSet.messageID = info.messageID;
      global.GoatBot.onReaction.set(info.messageID, formSet);
    });
  },

  onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
    const { author, newPrefix, setGlobal } = Reaction;
    if (event.userID!== author) return;
    
    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
      return message.reply(getLang("successGlobal", newPrefix));
    }
    
    await threadsData.set(event.threadID, newPrefix, "data.prefix");
    return message.reply(getLang("successThisThread", newPrefix));
  },

  onChat: async function ({ event, message, threadsData }) {
    const globalPrefix = global.GoatBot.config.prefix;
    const threadPrefix = await threadsData.get(event.threadID, "data.prefix") || globalPrefix;
    
    if (event.body && event.body.toLowerCase() === "prefix") {
      // COLLE TON LIEN CATBOX ICI 👇
      const imageLink = "https://files.catbox.moe/TON_LIEN_ICI.gif"; // <- Remplace par le lien de BRYAN SABIN

      try {
        return message.reply({ 
          body: "╔══『 BRYAN SABIN 』══╗\n" +
                `║ 🌍 System : ${globalPrefix}\n` +
                `║ 💬 Chatbox : ${threadPrefix}\n` +
                `║ ➤ ${threadPrefix}help | Menu\n` +
                "╚══════════╝\n" +
                "⚡ Powered by BRYAN SABIN ⚡",
          attachment: await utils.getStreamFromURL(imageLink)
        });
      } catch (e) {
        // Fallback si image 404
        return message.reply("╔══『 BRYAN SABIN 』══╗\n" +
              `║ 🌍 System : ${globalPrefix}\n` +
              `║ 💬 Chatbox : ${threadPrefix}\n` +
              `║ ➤ ${threadPrefix}help | Menu\n` +
              "╚══════════╝\n" +
              "⚡ Powered by BRYAN SABIN ⚡");
      }
    }
  }
};
