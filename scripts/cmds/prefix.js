const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "prefix",
    version: "1.0",
    author: "YourName",
    countDown: 3,
    role: 0,
    description: "Replies with the bot's current prefix",
    category: "info",
    guide: {
      en: "{pn} : shows the current bot prefix"
    }
  },

  onStart: async function ({ api, event, message }) {
    try {
      const prefix = global.GoatBot.getPrefix(event.threadID);

      const messageBody = `Yo, my prefix is [ 𓆩 '${prefix}' 𓆪 ]\n\n𝗦𝗢𝗠𝗘 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 𝗧𝗛𝗔𝗧 𝗠𝗔𝗬 𝗛𝗘𝗟𝗣 𝗬𝗢𝗨:\n➥ ${prefix}help [command] -> information and usage of command\n\nHave fun using it, enjoy! ❤`;

      const imagePath = path.join(__dirname, 'cache', 'josh.jpeg');

      if (fs.existsSync(imagePath)) {
        const attachment = fs.createReadStream(imagePath);
        return message.reply({ body: messageBody, attachment });
      }

      return message.reply(messageBody);
    } catch (error) {
      console.error('Error executing command:', error);
      return message.reply('An error occurred while executing the command.');
    }
  },
};
