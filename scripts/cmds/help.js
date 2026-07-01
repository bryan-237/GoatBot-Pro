module.exports.config = {
  name: "help",
  version: "2.0.1",
  hasPermission: 0,
  credits: "Grandpa EJ",
  description: "Beginner's Guide",
  usePrefix: true,
  commandCategory: "guide",
  usages: "[Shows Commands]",
  cooldowns: 5,
  envConfig: {
    autoUnsend: true,
    delayUnsend: 60
  }
};


module.exports.languages = {
  en: {
    moduleInfo:
      "「 %1 」\n%2\n\n❯ Usage: %3\n❯ Category: %4\n❯ Waiting time: %5 seconds(s)\n❯ Permission: %6\n\n» Module code by %7 ",
    helpList:
      `◖There are %1 commands and %2 categories on this bot.`,
    guideList:
      `◖Use: "%1${this.config.name} ‹command›" to know how to use that command!\n◖Type: "%1${this.config.name} ‹page_number›" to show that page contents!`,
    user: "User",
    adminGroup: "Admin group",
    adminBot: "Admin bot",
  },
};


module.exports.handleEvent = function ({ api, event, getText }) {
  const { commands } = global.client;
  const { threadID, messageID, body } = event;

  if (!body || typeof body == "undefined" || body.indexOf("help") != 0)
    return;

  // Don't respond to prefixed commands - let the run function handle those
  const threadSettingEvent = global.data.threadData.get(parseInt(threadID)) || {};
  const prefixEvent = threadSettingEvent.hasOwnProperty("PREFIX")
    ? threadSettingEvent.PREFIX
    : global.config.PREFIX;

  if (body.startsWith(prefixEvent)) return;

  const splitBody = body.slice(body.indexOf("help")).trim().split(/\s+/);
  if (splitBody.length == 1 || !commands.has(splitBody[1].toLowerCase())) return;
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const command = commands.get(splitBody[1].toLowerCase());
  const prefix = threadSetting.hasOwnProperty("PREFIX")
    ? threadSetting.PREFIX
    : global.config.PREFIX;
  // Handle both Mirai (usages) and GoatBot (guide) command formats for handleEvent
  let usageText;
  if (command.config.guide) {
    // GoatBot style - replace {pn} with prefix
    usageText = command.config.guide.replace(/\{pn\}/g, prefix);
  } else if (command.config.usages) {
    // Mirai style
    usageText = `${prefix}${command.config.name} ${command.config.usages}`;
  } else {
    usageText = `${prefix}${command.config.name}`;
  }

  return api.sendMessage(
    getText(
      "moduleInfo",
      command.config.name,
      command.config.description,
      usageText,
      command.config.commandCategory,
      command.config.cooldowns,
      command.config.hasPermission === 0
        ? getText("user")
        : command.config.hasPermission === 1
        ? getText("adminGroup")
        : getText("adminBot"),
      command.config.credits
    ),
    threadID,
    messageID
  );
};

module.exports.run = async function ({ api, event, args, getText }) {
  const { commands } = global.client;
  const { threadID, messageID } = event;
  const commandArg = (args[0] || "").toLowerCase();
  // Find command by name or alias
  let command = commands.get(commandArg);
  if (!command) {
    command = Array.from(commands.values()).find(cmd => Array.isArray(cmd.config.aliases) && cmd.config.aliases.map(a => a.toLowerCase()).includes(commandArg));
  }
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const { autoUnsend, delayUnsend } = global.configModule[this.config.name];
  const prefix = threadSetting.hasOwnProperty("PREFIX")
    ? threadSetting.PREFIX
    : global.config.PREFIX;

  if (!command) {
    const commandList = Array.from(commands.values());
    const categories = Array.from(new Set(commandList.map(cmd => cmd.config.commandCategory)));
    const itemsPerPage = 10;
    const totalPages = Math.ceil(categories.length / itemsPerPage);
    let currentPage = 1;
    if (args[0]) {
      const parsedPage = parseInt(args[0]);
      if (!isNaN(parsedPage) && parsedPage >= 1 && parsedPage <= totalPages) {
        currentPage = parsedPage;
      } else if (categories.map(c => c.toLowerCase()).includes(commandArg)) {
        // If argument matches a category, show all commands in that category
        const category = categories.find(c => c.toLowerCase() === commandArg);
        const categoryCommands = commandList.filter(cmd => cmd.config.commandCategory === category);
        let msg = `╭━━━[ ${category} ]━━━╮\n`;
        msg += `Commands in this category:\n`;
        msg += categoryCommands.map(cmd => `• ${cmd.config.name}`).join("\n");
        msg += `\n╰━━━━━━━━━━━━╯`;
        return api.sendMessage(msg, threadID, messageID);
      } else {
        return api.sendMessage(
          `◖Oops! You went too far! Please choose a page between 1 and ${totalPages}◗`,
          threadID,
          messageID
        );
      }
    }
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const visibleCategories = categories.slice(startIdx, endIdx);
    let msg = "";
    for (let i = 0; i < visibleCategories.length; i++) {
      const category = visibleCategories[i];
      const categoryCommands = commandList.filter(cmd => cmd.config.commandCategory === category);
      const commandNames = [...new Set(categoryCommands.map(cmd => cmd.config.name))];
      const numberFont = ["❶","❷","❸","❹","❺","❻","❼","❽","❾","❿"];
      msg += `╭[ ${numberFont[i]} ]─❍ ${category}\n╰─◗ ${commandNames.join(", ")}\n\n`;
    }
    const numberFontPage = ["❶","❷","❸","❹","❺","❻","❼","❽","❾","❿","⓫","⓬","⓭","⓮","⓯","⓰","⓱","⓲","⓳","⓴"];
    msg += `╭ ──────── ╮\n│ Page ${numberFontPage[currentPage - 1]} of ${numberFontPage[totalPages - 1]} │\n╰ ──────── ╯\n`;
    msg += getText("helpList", commands.size, categories.length, prefix);

    const fs = require("fs-extra");
    const path = __dirname + "/../../assets/img/help.png";
    let imgP = [];
    if (fs.existsSync(path)) {
      imgP.push(fs.createReadStream(path));
    }
    const config = require("./../../config.json");
    const msgg = {
      body:
        `╭━━━━━━━━━━━━╮\n` +
        `┃   🤖 CYBER BOT HELP   ┃\n` +
        `╰━━━━━━━━━━━━╯\n` +
        `\n` +
        `👤 Bot Owner: ${config.DESIGN.Admin}\n` +
        `\n` +
        msg +
        `\n` +
        `◖Total pages available: ${totalPages}◗\n` +
        `\n` +
        `╭──>> FUTURE GUIDE ❍\n` +
        getText("guideList", config.PREFIX) +
        `\n`,
      attachment: imgP,
    };
    const sentMessage = await api.sendMessage(msgg, threadID, messageID);
    if (autoUnsend) {
      setTimeout(async () => {
        await api.unsendMessage(sentMessage.messageID);
      }, delayUnsend * 1000);
    }
  } else {
    // Show all config details for the command
    const details = command.config;
    let info = `╭━━━[ ${details.name} ]━━━╮\n`;
    info += `Description: ${details.description || "No description provided"}\n`;
    info += `Version: ${details.version || "1.0"}\n`;
    info += `Credits: ${details.credits || "Unknown"}\n`;
    info += `Category: ${details.commandCategory || "uncategorized"}\n`;
    // Handle both Mirai (usages) and GoatBot (guide) command formats
    if (details.guide) {
      // GoatBot style - replace {pn} with prefix
      const guideText = details.guide.replace(/\{pn\}/g, prefix);
      info += `Guide: ${guideText}\n`;
    } else if (details.usages) {
      // Mirai style
      info += `Usage: ${Array.isArray(details.usages) ? details.usages.join("\n- ") : details.usages}\n`;
    } else {
      info += `Usage: ${prefix}${details.name}\n`;
    }
    info += `Cooldown: ${details.cooldowns || 5}s\n`;
    info += `Permission: ${details.hasPermission === 0 ? getText("user") : details.hasPermission === 1 ? getText("adminGroup") : details.hasPermission === 2 ? getText("adminBot") : getText("user")}\n`;
    if (details.aliases && Array.isArray(details.aliases) && details.aliases.length) {
      info += `Aliases: ${details.aliases.join(", ")}\n`;
    }
    if (details.envConfig) {
      info += `AutoUnsend: ${details.envConfig.autoUnsend ? "Yes" : "No"}\n`;
      info += `DelayUnsend: ${details.envConfig.delayUnsend || "N/A"}s\n`;
    }
    info += `╰━━━━━━━━━━━━━━━━━━╯`;
    return api.sendMessage(info, threadID, messageID);
  }
};
