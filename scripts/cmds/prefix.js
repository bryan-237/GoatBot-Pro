module.exports = {
  config: {
    name: "prefix",
    version: "1.0.0",
    author: "Grandpa EJ",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Show current prefix" },
    description: { en: "Show current prefix" },
    category: "info",
    guide: { en: "{pn}" }
  },

  onStart: async function({ api, event, threadsData }) {
    const { threadID, messageID } = event;
    const data = await threadsData.get(threadID);
    const currentPrefix = data.data.prefix || global.GoatBot.config.prefix || "?";
    api.sendMessage(`Current prefix is: ${currentPrefix}`, threadID, messageID);
  }
};
