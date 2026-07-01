const isLinkTik = /tiktok.com/i;
const isLinkYt = /youtube.com|youtu.be/i;
const isLinkTel = /telegram.com|t.me/i;
const isLinkFb = /facebook.com|fb.me/i;
const isLinkIg = /instagram.com/i;
const isLinkTw = /twitter.com|x.com/i;
const isLinkDc = /discord.com|discord.gg/i;
const isLinkTh = /threads.net/i;
const isLinkTch = /twitch.tv/i;

module.exports = {
  config: {
    name: "antilink",
    version: "1.0",
    author: "BRYAN SABIN",
    countDown: 0,
    role: 0,
    description: "Auto kick anti link social media",
    category: "admin",
    guide: { en: "{pn} on/off" }
  },

  onChat: async function ({ api, event, threadsData, message }) {
    const { threadID, senderID, body, messageID, participantIDs } = event;
    if (!body) return;
    if (senderID == api.getCurrentUserID()) return; // fromMe

    const threadData = await threadsData.get(threadID);
    const isBotAdmin = participantIDs.includes(api.getCurrentUserID());
    const isAdmin = threadData.adminIDs?.includes(senderID);
    const chat = threadData.data || {};

    if (isAdmin ||!isBotAdmin) return; // Admin bypass | Bot pas admin = rien

    const toUser = senderID.split("@")[0];
    const mentions = [{ id: senderID, tag: `@${toUser}` }];

    const isAntiLinkTik = isLinkTik.exec(body);
    const isAntiLinkYt = isLinkYt.exec(body);
    const isAntiLinkTel = isLinkTel.exec(body);
    const isAntiLinkFb = isLinkFb.exec(body);
    const isAntiLinkIg = isLinkIg.exec(body);
    const isAntiLinkTw = isLinkTw.exec(body);
    const isAntiLinkDc = isLinkDc.exec(body);
    const isAntiLinkTh = isLinkTh.exec(body);
    const isAntiLinkTch = isLinkTch.exec(body);

    const kickUser = async (type) => {
      if (chat.delete) return api.sendMessage(`⚠️ Lien détecté mais mode delete activé`, threadID, messageID);
      
      await api.sendMessage({ body: `⚠️ Anti-Link | ${type} interdit\nTag: @${toUser}`, mentions }, threadID);
      await api.deleteMessage(messageID); // delete msg
      try {
        await api.removeUserFromGroup(senderID, threadID); // kick
      } catch (e) {
        console.log("Kick failed 404:", e.message);
      }
    };

    if (chat.antiTiktok && isAntiLinkTik) return kickUser("TikTok");
    if (chat.antiYoutube && isAntiLinkYt) return kickUser("YouTube");
    if (chat.antiTelegram && isAntiLinkTel) return kickUser("Telegram");
    if (chat.antiFacebook && isAntiLinkFb) return kickUser("Facebook");
    if (chat.antiInstagram && isAntiLinkIg) return kickUser("Instagram");
    if (chat.antiTwitter && isAntiLinkTw) return kickUser("Twitter/X");
    if (chat.antiDiscord && isAntiLinkDc) return kickUser("Discord");
    if (chat.antiThreads && isAntiLinkTh) return kickUser("Threads");
    if (chat.antiTwitch && isAntiLinkTch) return kickUser("Twitch");
  },

  onStart: async function ({ message, args, threadsData, event }) {
    const { threadID } = event;
    if (!args[0]) return message.reply("Usage: antilink on/off");
    
    const data = await threadsData.get(threadID, "data") || {};
    if (args[0] === "on") {
      data.antiTiktok = data.antiYoutube = data.antiTelegram = data.antiFacebook = true;
      data.antiInstagram = data.antiTwitter = data.antiDiscord = data.antiThreads = data.antiTwitch = true;
      await threadsData.set(threadID, data, "data");
      return message.reply("✅ AntiLink ON: Tous les réseaux activés | BRYAN SABIN");
    }
    if (args[0] === "off") {
      await threadsData.set(threadID, {}, "data");
      return message.reply("❌ AntiLink OFF");
    }
  }
};
