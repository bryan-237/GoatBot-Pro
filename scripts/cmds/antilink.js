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
    version: "1.3",
    author: "BRYAN SABIN",
    countDown: 0,
    role: 1, // GoatBot check admin automatiquement pour onStart
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
      offSuccess: "❌ AntiLink OFF",
      noThreadID: "⚠️ Impossible de récupérer l'ID de ce chat, réessaie."
    }
  },

  onStart: async function ({ message, args, threadsData, event, getLang }) {
    // Fallback multi-sources : évite le crash INVALID_THREAD_ID
    const threadID = event?.threadID || message?.threadID;
    if (!threadID) return message.reply(getLang("noThreadID"));

    if (!args[0]) return message.reply(getLang("needArgs", this.config.name));

    const action = args[0].toLowerCase();

    if (action === "on") {
      const update = { delete: false };
      for (const link of linkPatterns) update[link.key] = true;
      await threadsData.set(threadID, update, "data");
      return message.reply(getLang("onSuccess"));
    }

    if (action === "delete") {
      await threadsData.set(threadID, { delete: true }, "data");
      return message.reply(getLang("deleteSuccess"));
    }

    if (action === "off") {
      await threadsData.set(threadID, {}, "data");
      return message.reply(getLang("offSuccess"));
    }

    return message.reply(getLang("needArgs", this.config.name));
  },

  onChat: async function ({ api, event, threadsData }) {
    const threadID = event?.threadID;
    const { senderID, body, messageID } = event || {};

    // Guard renforcé : coupe court si les données essentielles manquent
    if (!threadID || !body || !senderID) return;
    if (senderID === api.getCurrentUserID()) return;

    let threadData;
    try {
      threadData = await threadsData.get(threadID);
    } catch (e) {
      console.log("antilink onChat - threadsData.get failed:", e.message);
      return;
    }

    const adminIDs = threadData.adminIDs || [];
    const botID = api.getCurrentUserID();

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
