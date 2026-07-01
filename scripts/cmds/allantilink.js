const isLinkTik = /tiktok\.com/i;
const isLinkYt = /youtube\.com|youtu\.be/i;
const isLinkTel = /telegram\.com|t\.me/i;
const isLinkFb = /facebook\.com|fb\.me/i;
const isLinkIg = /instagram\.com/i;
const isLinkTw = /twitter\.com|x\.com/i;
const isLinkDc = /discord\.com|discord\.gg/i;
const isLinkTh = /threads\.net/i;
const isLinkTch = /twitch\.tv/i;

module.exports = {
  config: {
    name: "antilink",
    version: "1.1",
    author: "BRYAN SABIN",
    countDown: 0,
    role: 0,
    description: "Auto kick anti link social media",
    category: "admin",
    guide: { en: "{pn} on/off\n{pn} delete (kick désactivé, suppression du message seulement)" }
  },

  onChat: async function ({ api, event, threadsData }) {
    const { threadID, senderID, body, messageID, participantIDs } = event;
    if (!body) return;
    if (senderID === api.getCurrentUserID()) return; // fromMe

    const threadData = await threadsData.get(threadID);
    const botID = api.getCurrentUserID();
    const adminIDs = threadData.adminIDs || [];

    const isSenderAdmin = adminIDs.includes(senderID);
    const isBotGroupAdmin = adminIDs.includes(botID);
    const isBotInGroup = participantIDs.includes(botID);

    const chat = threadData.data || {};

    // Admin du groupe = bypass | Bot pas dans le groupe ou pas admin = ne peut rien faire
    if (isSenderAdmin || !isBotInGroup || !isBotGroupAdmin) return;

    const mentions = [{ id: senderID, tag: `@${senderID}` }];

    const matches = {
      TikTok: isLinkTik.exec(body),
      YouTube: isLinkYt.exec(body),
      Telegram: isLinkTel.exec(body),
      Facebook: isLinkFb.exec(body),
      Instagram: isLinkIg.exec(body),
      "Twitter/X": isLinkTw.exec(body),
      Discord: isLinkDc.exec(body),
      Threads: isLinkTh.exec(body),
      Twitch: isLinkTch.exec(body)
    };

    const enabledMap = {
      TikTok: chat.antiTiktok,
      YouTube: chat.antiYoutube,
      Telegram: chat.antiTelegram,
      Facebook: chat.antiFacebook,
      Instagram: chat.antiInstagram,
      "Twitter/X": chat.antiTwitter,
      Discord: chat.antiDiscord,
      Threads: chat.antiThreads,
      Twitch: chat.antiTwitch
    };

    for (const type in matches) {
      if (enabledMap[type] && matches[type]) {
        return kickUser(api, threadID, messageID, senderID, mentions, chat, type);
      }
    }
  },

  onStart: async function ({ message, args, threadsData, event, api }) {
    const { threadID, senderID } = event;

    const threadData = await threadsData.get(threadID);
    const adminIDs = threadData.adminIDs || [];
    if (!adminIDs.includes(senderID)) {
      return message.reply("❌ Seuls les admins du groupe peuvent utiliser cette commande.");
    }

    if (!args[0]) return message.reply("Usage: antilink on/off/delete");

    const data = threadData.data || {};

    if (args[0] === "on") {
      Object.assign(data, {
        antiTiktok: true, antiYoutube: true, antiTelegram: true,
        antiFacebook: true, antiInstagram: true, antiTwitter: true,
        antiDiscord: true, antiThreads: true, antiTwitch: true,
        delete: false
      });
      await threadsData.set(threadID, data, "data");
      return message.reply("✅ AntiLink ON: Tous les réseaux activés (kick) | BRYAN SABIN");
    }

    if (args[0] === "off") {
      await threadsData.set(threadID, {}, "data");
      return message.reply("❌ AntiLink OFF");
    }

    if (args[0] === "delete") {
      data.delete = true;
      await threadsData.set(threadID, data, "data");
      return message.reply("🗑️ AntiLink en mode suppression uniquement (pas de kick)");
    }
  }
};

async function kickUser(api, threadID, messageID, senderID, mentions, chat, type) {
  if (chat.delete) {
    await api.deleteMessage(messageID);
    return api.sendMessage(`⚠️ Lien ${type} supprimé (mode delete activé)`, threadID);
  }

  await api.sendMessage({ body: `⚠️ Anti-Link | ${type} interdit`, mentions }, threadID);
  try {
    await api.deleteMessage(messageID);
    await api.removeUserFromGroup(senderID, threadID);
  } catch (e) {
    console.log("Kick failed:", e.message);
  }
}
