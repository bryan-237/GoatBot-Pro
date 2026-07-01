const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;
const doNotDelete = "[ 🐐 | V2 ]"; // changing this wont change the goatbot V2 of list cmd it is just a decoyy 

module.exports = {
  config: {
    name: "help",
    version: "1.17",
    author: "NTKhang", // original author Kshitiz
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "View command usage and list all commands directly",
    },
    longDescription: {
      en: "View command usage and list all commands directly",
    },
    category: "info",
    guide: {
      en: "{pn} / help cmdName ",
    },
    priority: 1,
  },

  onStart: async function ({ message, args, event, threadsData, role }) {
    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    const prefix = getPrefix(threadID);

    if (args.length === 0) {
      const categories = {};
      let msg = "";
      msg += `╔═══════════╗\n ★𝙃𝙚𝙮 𝙞𝙖𝙢 XENOZ 𝙜𝙤𝙖𝙩𝙗𝙤𝙩.𝙈𝙮 𝙥𝙧𝙚𝙛𝙞𝙭. 𝙢𝙮 𝙤𝙬𝙣𝙚𝙧 RYUK4ZI ORIG. 𝙁𝙗- https://www.facebook.com/profile.php?id=100086747072197&mibextid=kFxxJD 💐\n╚═══════════╝`; // replace with your name 

      for (const [name, value] of commands) {
        if (value.config.role > 1 && role < value.config.role) continue;
        const category = value.config.category || "Uncategorized";
        categories[category] = categories[category] || { commands: [] };
        categories[category].commands.push(name);
      }

      Object.keys(categories).forEach((category) => {
        if (category!== "info") {
          msg += `\n╭───────────\n│ 『 ${category.toUpperCase()} 』`;
          const names = categories[category].commands.sort();
          for (let i = 0; i < names.length; i += 3) {
            const cmds = names.slice(i, i + 3).map((item) => `✰${item}`);
            msg += `\n│ ${cmds.join(" ".repeat(Math.max(1, 10 - cmds.join("").length)))}`;
          }
          msg += `\n╰────────────`;
        }
      });

      const totalCommands = commands.size;
      msg += `\n𝗖𝘂𝗿𝗲𝗻𝘁𝗹𝘆, 𝘁𝗵𝗲 𝗯𝗼𝘁 𝗵𝗮𝘀 ${totalCommands} 𝗰𝗼𝗺𝗮𝗻𝗱𝘀 𝘁𝗵𝗮𝘁 𝗰𝗮𝗻 𝗯𝗲 𝘂𝘀𝗲𝗱\n`;
      msg += `𝗧𝘆𝗽𝗲 ${prefix} 𝗵𝗲𝗹𝗽 𝗰𝗺𝗱𝗡𝗮𝗺𝗲 𝘁𝗼 𝘃𝗶𝗲𝘄 𝘁𝗵𝗲 𝗱𝗲𝘁𝗮𝗶𝗹𝘀 𝗼𝗳 𝘁𝗵𝗮𝘁 𝗰𝗼𝗺𝗮𝗻𝗱\n`;
      msg += `🐐 | RYUK4ZI`; // its not decoy so change it if you want 

      const helpListImages = [
        "https://i.ibb.co/6mYZLhN/image.jpg", // add image link here
        "https://i.ibb.co/qNNtQ7n/image.jpg",
        "https://i.ibb.co/ZKYCpcV/image.jpg",
        "https://i.ibb.co/0BXSbMN/image.jpg",
        "https://i.ibb.co/g36mkXJ/image.jpg", // Add more image links as needed
      ];
      const helpListImage = helpListImages[Math.floor(Math.random() * helpListImages.length)];

      // FIX ICI: Si image 404, envoie texte seul au lieu de crash
      try {
        await message.reply({ 
          body: msg, 
          attachment: await global.utils.getStreamFromURL(helpListImage), 
        });
      } catch (e) {
        console.error("Help image failed 404:", e.message);
        await message.reply(msg); // fallback sans image
      }

    } else {
      const commandName = args[0].toLowerCase();
      const command = commands.get(commandName) || commands.get(aliases.get(commandName));
      if (!command) {
        await message.reply(`Command "${commandName}" not found.`);
      } else {
        const configCommand = command.config;
        const roleText = roleTextToString(configCommand.role);
        const author = configCommand.author || "Unknown";
        const longDescription = configCommand.longDescription? configCommand.longDescription.en || "No description" : "No description";
        const guideBody = configCommand.guide?.en || "No guide available.";
        const usage = guideBody.replace(/{p}/g, prefix).replace(/{n}/g, configCommand.name);
        const response = `╭── NAME ────⭓ 
│ ${configCommand.name} 
├── INFO 
│ Description: ${longDescription} 
│ Other names: ${configCommand.aliases? configCommand.aliases.join(", ") : "Do not have"} 
│ Other names in your group: Do not have 
│ Version: ${configCommand.version || "1.0"} 
│ Role: ${roleText} 
│ Time per command: ${configCommand.countDown || 1}s 
│ Author: ${author} 
├── Usage 
│ ${usage} 
├── Notes 
│ The content inside <XXXXX> can be changed 
│ The content inside [a|b|c] is a or b or c 
╰━━━━━━━❖`;
        await message.reply(response);
      }
    }
  },
};

function roleTextToString(roleText) {
  switch (roleText) {
    case 0:
      return "0 (All users)";
    case 1:
      return "1 (Group administrators)";
    case 2:
      return "2 (Admin bot)";
    default:
      return "Unknown role";
  }
}
