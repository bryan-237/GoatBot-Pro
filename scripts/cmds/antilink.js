module.exports = {
  config: {
    name: "antilink",
    version: "3.0",
    author: "Big Bryan",
    countDown: 0,
    role: 1,
    description: { en: "Block all links", fr: "Bloque tous les liens" },
    category: "admin",
    guide: { en: "{pn} on/off", fr: "{pn} on/off" },
    envConfig: { maxWarn: 2, action: "kick", ignoreAdmin: false, ignoreBotAdmin: true, whitelist: [] }
  },
  langs: {
    en: { on: "✅ AntiLink ON", off: "❌ AntiLink OFF", alreadyOn: "Already ON", alreadyOff: "Already OFF", detected: "⚠️ %1 Stop sending links. Warn %2/2", kicked: "🚫 %1 KICKED for links x2" },
    fr: { on: "✅ AntiLink activé", off: "❌ AntiLink désactivé", alreadyOn: "Déjà activé", alreadyOff: "Déjà désactivé", detected: "⚠️ %1 Pas de lien. Warn %2/2", kicked: "🚫 %1 EXPULSÉ pour liens x2" }
  },
  onStart: async function ({ args, threadsData, message, event, getLang }) {
    const { threadID } = event;
    const data = await threadsData.get(threadID);
    if (args[0] == "on") { data.data.antilink = true; await threadsData.set(threadID, data); return message.reply(getLang("on")); }
    if (args[0] == "off") { data.data.antilink = false; await threadsData.set(threadID, data); return message.reply(getLang("off")); }
  },
  onChat: async function ({ api, event, threadsData, usersData, message, envCommands }) {
    const { threadID, senderID, body } = event;
    const data = await threadsData.get(threadID);
    if (!data.data.antilink) return;
    if (envCommands.antilink.ignoreAdmin) { const t = await api.getThreadInfo(threadID); if (t.adminIDs.some(e => e.id == senderID)) return; }
    const linkRegex = /(https?:\/\/)?(www\.)?(facebook|fb|tiktok|youtube|discord|wa\.me|telegram|instagram|x\.com)\.[\w\.-]+/gi;
    if (!body.match(linkRegex)) return;
    data.data.antilinkWarns = data.data.antilinkWarns || {}; data.data.antilinkWarns[senderID] = (data.data.antilinkWarns[senderID] || 0) + 1;
    const warnCount = data.data.antilinkWarns[senderID]; await threadsData.set(threadID, data);
    const name = await usersData.getName(senderID);
    if (warnCount >= 2) {
      data.data.antilinkWarns[senderID] = 0; await threadsData.set(threadID, data);
      message.reply(getLang("kicked", name));
      try { await api.removeUserFromGroup(senderID, threadID); } catch (e) { message.reply("❌ Le bot n'est pas admin, impossible de kick.") }
    } else { message.reply(getLang("detected", name, warnCount)); }
  }
};
