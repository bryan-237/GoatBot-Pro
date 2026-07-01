module.exports = {
  config: {
    name: "help",
    version: "2.0.1",
    author: "Grandpa EJ",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Beginner's Guide" },
    description: { en: "Shows all commands and command info" },
    category: "guide",
    guide: { en: "{pn} [command|page]" },
    envConfig: { autoUnsend: true, delayUnsend: 60 }
  },

  langs: {
    en: {
      moduleInfo: "「 %1 」\n%2\n❯ Usage: %3\n❯ Category: %4\n❯ Waiting time: %5 second(s)\n❯ Permission: %6\n» Module code by %7 ",
      helpList: `◖There are %1 commands and %2 categories on this bot.`,
      guideList: `◖Use: "%1help <command>" to know how to use that command!\n◖Type: "%1help <page_number>" to show that page contents!`,
      user: "User",
      adminGroup: "Admin group",
      adminBot: "Admin bot"
    },
    fr: {
      moduleInfo: "「 %1 」\n%2\n❯ Usage: %3\n❯ Catégorie: %4\n❯ Temps d'attente: %5 seconde(s)\n❯ Permission: %6\n» Code par %7 ",
      helpList: `◖Il y a %1 commandes et %2 catégories sur ce bot.`,
      guideList: `◖Utilise: "%1help <commande>" pour savoir comment utiliser!\n◖Tape: "%1help <numéro_page>" pour voir la page!`,
      user: "Utilisateur",
      adminGroup: "Admin groupe",
      adminBot: "Admin bot"
    }
  },

  onStart: async function ({ api, event, args, getLang, threadsData, commands }) {
    const { threadID, messageID } = event;
    const { autoUnsend, delayUnsend } = this.config.envConfig;

    const data = await threadsData.get(threadID);
    const prefix = data.data.prefix || global.GoatBot.config.prefix || "?";

    const commandArg = (args[0] || "").toLowerCase();

    // Find command by name or alias
    let command = commands.get(commandArg);
    if (!command) {
      command = Array.from(commands.values()).find(cmd =>
        Array.isArray(cmd.config.aliases) && cmd.config.aliases.map(a => a.toLowerCase()).includes(commandArg)
      );
    }

    if (!command) {
      const commandList = Array.from(commands.values());
      const categories = Array.from(new Set(commandList.map(cmd => cmd.config.category || "Misc")));
      const itemsPerPage = 10;
      const totalPages = Math.ceil(categories.length / itemsPerPage);
      let currentPage = 1;

      if (args[0]) {
        const parsedPage = parseInt(args[0]);
        if (!isNaN(parsedPage) && parsedPage >= 1 && parsedPage <= totalPages) {
          currentPage = parsedPage;
        } else if (categories.map(c => c.toLowerCase()).includes(commandArg)) {
          const category = categories.find(c => c.toLowerCase() === commandArg);
          const categoryCommands = commandList.filter(cmd => (cmd.config.category || "Misc") === category);
          let msg = `╭━━━[ ${category} ]━━━╮\n`;
          msg += `Commands in this category:\n`;
          msg += categoryCommands.map(cmd => `• ${cmd.config.name}`).join("\n");
          msg += `\n╰━━━━━━━━━━━━╯`;
          return api.sendMessage(msg, threadID, messageID);
        } else {
          return api.sendMessage(`◖Oops! You went too far! Please choose a page between 1 and ${totalPages}◗`, threadID, messageID);
        }
      }

      const startIdx = (currentPage - 1) * itemsPerPage;
      const endIdx = startIdx + itemsPerPage;
      const visibleCategories = categories.slice(startIdx, endIdx);

      let msg = "";
      const numberFont = ["❶","❷","❸","❹","❺","❻","❼","❽","❾","❿"];
      for (let i = 0; i < visibleCategories.length; i++) {
        const category = visibleCategories[i];
        const categoryCommands = commandList.filter(cmd => (cmd.config.category || "Misc") === category);
        const commandNames = [...new Set(categoryCommands.map(cmd => cmd.config.name))];
        msg += `╭[ ${numberFont[i]} ]─❍ ${category}\n╰─◗ ${commandNames.join(", ")}\n\n`;
      }

      const numberFontPage = ["❶","❷","❸","❹","❺","❻","❼","❽","❾","❿","⓫","⓬","⓭","⓮","⓯","⓰","⓱","⓲","⓳","⓴"];
      msg += `╭ ──────── ╮\n│ Page ${numberFontPage[currentPage - 1]} of ${numberFontPage[totalPages - 1]} │\n╰ ──────── ╯\n`;
      msg += getLang("helpList", commands.size, categories.length);

      const fs = require("fs-extra");
      const path = __dirname + "/../../assets/img/help.png";
      let imgP = [];
      if (fs.existsSync(path)) imgP.push(fs.createReadStream(path));

      const config = global.GoatBot.config;
      const msgg = {
        body: `╭━━━━━━━━━━━━╮\n` +
              `┃ 🤖 CYBER BOT HELP ┃\n` +
              `╰━━━━━━━━━━━━╯\n` +
              `\n` +
              `👤 Bot Owner: ${config.ADMINBOT?.[0] || "Unknown"}\n` +
              `\n` +
              msg + `\n` +
              `◖Total pages available: ${totalPages}◗\n` +
              `\n` +
              `╭──>> FUTURE GUIDE ❍\n` +
              getLang("guideList", prefix) + `\n`,
        attachment: imgP
      };

      const sentMessage = await api.sendMessage(msgg, threadID, messageID);
      if (autoUnsend) {
        setTimeout(async () => {
          try { await api.unsendMessage(sentMessage.messageID); } catch (e) {}
        }, delayUnsend * 1000);
      }
    } else {
      // Show all config details for the command
      const details = command.config;
      const roleMap = {0: getLang("user"), 1: getLang("adminGroup"), 2: getLang("adminBot")};

      let info = `╭━━━[ ${details.name} ]━━━╮\n`;
      info += `Description: ${details.description?.en || details.shortDescription?.en || "No description provided"}\n`;
      info += `Version: ${details.version || "1.0"}\n`;
      info += `Credits: ${details.author || "Unknown"}\n`;
      info += `Category: ${details.category || "uncategorized"}\n`;

      if (details.guide?.en) {
        info += `Guide: ${details.guide.en.replace(/\{pn\}/g, prefix)}\n`;
      } else {
        info += `Usage: ${prefix}${details.name}\n`;
      }

      info += `Cooldown: ${details.countDown || 5}s\n`;
      info += `Permission: ${roleMap[details.role] || getLang("user")}\n`;

      if (details.aliases?.length) info += `Aliases: ${details.aliases.join(", ")}\n`;
      info += `╰━━━━━━━━━━╯`;
      return api.sendMessage(info, threadID, messageID);
    }
  },

  onChat: async function ({ api, event, getLang, threadsData, commands }) {
    const { threadID, messageID, body } = event;
    if (!body ||!body.toLowerCase().startsWith("help")) return;

    const data = await threadsData.get(threadID);
    const prefix = data.data.prefix || global.GoatBot.config.prefix || "?";
    if (body.startsWith(prefix)) return; // Let onStart handle prefixed

    const splitBody = body.trim().split(/\s+/);
    if (splitBody.length == 1) return;

    const command = commands.get(splitBody[1].toLowerCase());
    if (!command) return;

    const usageText = command.config.guide?.en?.replace(/\{pn\}/g, prefix) || `${prefix}${command.config.name}`;
    const roleMap = {0: getLang("user"), 1: getLang("adminGroup"), 2: getLang("adminBot")};

    return api.sendMessage(
      getLang("moduleInfo",
        command.config.name,
        command.config.description?.en || command.config.shortDescription?.en,
        usageText,
        command.config.category || "Misc",
        command.config.countDown || 5,
        roleMap[command.config.role] || getLang("user"),
        command.config.author
      ),
      threadID,
      messageID
    );
  }
};
