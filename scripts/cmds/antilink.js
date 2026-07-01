const linkPatterns = [
  { key: "antiTiktok", label: "TikTok", regex: /tiktok\.com/i },
  { key: "antiYoutube", label: "YouTube", regex: /youtube\.com|youtu\.be/i },
  { key: "antiTelegram", label: "Telegram", regex: /telegram\.com|t\.me/i },
  { key: "antiFacebook", label: "Facebook", regex: /facebook\.com|fb\.me/i },
  { key: "antiInstagram", label: "Instagram", regex: /instagram\.com/i },
  { key: "antiTwitter", label: "Twitter/X", regex: /twitter\.com|x\.com/i },
  { key: "antiDiscord", label: "Discord", regex: /discord\.com|discord\.gg/i },
  { key: "antiThreads", label: "Threads", regex: /threads\.net/i },
  { key: "antiTwitch", label: "Twitch", regex: /twitch\.tv/i }
];

module.exports = {
  config: {
    name: "antilink",
    version: "1.2",
    author: "BRYAN SABIN",
    countDown: 0,
    role: 1, // GoatBot exige automatiquement que l'expéditeur soit admin du groupe pour onStart
    description: "Auto kick anti link social media",
    category: "admin",
    guide: {
      en: "{pn} on: enable antilink (kick)\n{pn} delete: enable antilink (delete only, no kick)\n{pn} off: disable antilink"
    }
  },

  langs: {
    en: {
      needArgs: "Usage: %1 on / off / delete",
      onSuccess: "✅ AntiLink ON: all networks enabled (kick)",
      deleteSuccess: "🗑️ AntiLink set to delete-only mode (no kick)",
      offSuccess: "❌ AntiLink OFF"
    }
  },

  onStart: async function ({ message, args, threadsData, getLang }) {
    if (!args[0]) return message.reply(getLang("needArgs", this.config.name));

    const action = args[0].toLowerCase();

    if (action === "on") {
      const update = { delete: false };
      for (const link of linkPatterns) update[link.key] = true;
      await threadsData.set(message.threadID, update, "data");
      return message.reply(getLang("onSuccess"));
    }

    if (action === "delete") {
      await threadsData.set(message.threadID, { delete: true }, "data");
      return message.reply(getLang("deleteSuccess"));
    }

    if (action === "off") {
      await threadsData.set(message.threadID, {}, "data");
      return message.reply(getLang("offSuccess"));
    }

    return message.reply(getLang("needArgs", this.config.name));
  },

  onChat: async function ({ api, event, threadsData }) {
    const { threadID, senderID, body, messageID } = event;
    if (!body) return;
    if (senderID === api.getCurrentUserID()) return;

    const threadData = await threadsData.get(threadID);
    const adminIDs = threadData.adminIDs || [];
    const botID = api.getCurrentUserID();

    // Bypass: sender is group admin | Bot must be group admin to enforce kicks
    if (adminIDs.includes(senderID) || !adminIDs.includes(botID)) return;

    const chat = threadData.data || {};
    const matched = linkPatterns.find(link => chat[link.key] && link.regex.test(body));
    if (!matched) return;

    await handleViolation(api, { threadID, messageID, senderID, label: matched.label, deleteOnly: !!chat.delete });
  }
};

async function handleViolation(api, { threadID, messageID, senderID, label, deleteOnly }) {
  try {
    await api.deleteMessage(messageID);
  } catch (e) {
    console.log("Delete message failed:", e.message);
  }

  if (deleteOnly) {
    return api.sendMessage(`⚠️ Lien ${label} supprimé (mode delete activé)`, threadID);
  }

  await api.sendMessage(
    { body: `⚠️ Anti-Link | ${label} interdit`, mentions: [{ id: senderID, tag: `@${senderID}` }] },
    threadID
  );

  try {
    await api.removeUserFromGroup(senderID, threadID);
  } catch (e) {
    console.log("Kick failed:", e.message);
  }
}
