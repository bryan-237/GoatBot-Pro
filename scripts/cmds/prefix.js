const fs = require("fs-extra");
const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    version: "3.0",
    author: "Claude",
    countDown: 5,
    role: 0,
    description: "Affiche ou modifie le prefix du bot",
    category: "⚙️ Configuration",
    guide: {
      en: "{pn} : affiche le prefix actuel\n" +
          "{pn} <new_prefix> : change le prefix pour ce chat\n" +
          "{pn} <new_prefix> -g : change le prefix global (admin bot uniquement)\n" +
          "{pn} reset : remet le prefix par défaut pour ce chat\n" +
          "{pn} reset -g : remet le prefix global par défaut (admin bot uniquement)"
    }
  },

  langs: {
    en: {
      currentPrefix:
        "╭──『 𝗣𝗥𝗘𝗙𝗜𝗫 』──╮\n" +
        "│ 🌍 Global : %1\n" +
        "│ 💬 Ce chat : %2\n" +
        "├──────────────\n" +
        "│ Change avec:\n" +
        "│ %2<prefix> ou %2<prefix> -g\n" +
        "╰──────────────╯",
      resetSuccess: "✅ Prefix réinitialisé sur : %1",
      resetGlobalSuccess: "✅ Prefix global réinitialisé sur : %1",
      onlyAdmin: "⛔ Seul un admin du bot peut modifier le prefix global.",
      invalidPrefix: "⚠️ Prefix invalide : pas d'espace, pas de vide, 5 caractères max.",
      samePrefix: "ℹ️ Le prefix est déjà « %1 ». Aucun changement effectué.",
      confirmGlobal: "⚙️ Réagis avec ✅ pour confirmer :\nChanger le prefix GLOBAL en « %1 »",
      confirmThisThread: "⚙️ Réagis avec ✅ pour confirmer :\nChanger le prefix de CE CHAT en « %1 »",
      successGlobal: "✅ Prefix global mis à jour : « %1 »",
      successThisThread: "✅ Prefix de ce chat mis à jour : « %1 »",
      expired: "⌛ Cette confirmation a expiré, relance la commande.",
      notAuthor: "⚠️ Seule la personne qui a lancé la commande peut confirmer."
    }
  },

  onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
    const globalPrefix = global.GoatBot.config.prefix;
    const threadPrefix = await threadsData.get(event.threadID, "data.prefix") || globalPrefix;

    // --- Aucun argument : affiche juste le prefix actuel ---
    if (!args[0]) {
      return message.reply(getLang("currentPrefix", globalPrefix, threadPrefix));
    }

    const isGlobalTarget = args[1] === "-g";

    // --- Reset ---
    if (args[0].toLowerCase() === "reset") {
      if (isGlobalTarget) {
        if (role < 2) return message.reply(getLang("onlyAdmin"));
        const defaultPrefix = global.GoatBot.config.defaultPrefix || ".";
        global.GoatBot.config.prefix = defaultPrefix;
        fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
        return message.reply(getLang("resetGlobalSuccess", defaultPrefix));
      }
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply(getLang("resetSuccess", globalPrefix));
    }

    // --- Validation du nouveau prefix ---
    const newPrefix = args[0];
    if (!newPrefix || /\s/.test(newPrefix) || newPrefix.length > 5) {
      return message.reply(getLang("invalidPrefix"));
    }

    // --- Vérifie si c'est déjà le prefix actuel ---
    const currentTarget = isGlobalTarget ? globalPrefix : threadPrefix;
    if (newPrefix === currentTarget) {
      return message.reply(getLang("samePrefix", newPrefix));
    }

    // --- Permission admin pour le global ---
    if (isGlobalTarget && role < 2) {
      return message.reply(getLang("onlyAdmin"));
    }

    // --- Demande de confirmation par réaction ---
    const formSet = {
      commandName,
      author: event.senderID,
      newPrefix,
      setGlobal: isGlobalTarget,
      createdAt: Date.now()
    };

    const confirmMessage = isGlobalTarget
      ? getLang("confirmGlobal", newPrefix)
      : getLang("confirmThisThread", newPrefix);

    return message.reply(confirmMessage, (err, info) => {
      if (err) return;
      formSet.messageID = info.messageID;
      global.GoatBot.onReaction.set(info.messageID, formSet);
    });
  },

  onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
    const { author, newPrefix, setGlobal, createdAt } = Reaction;

    if (event.userID !== author) {
      return message.reply(getLang("notAuthor"));
    }

    // Expiration après 2 minutes
    if (createdAt && Date.now() - createdAt > 2 * 60 * 1000) {
      return message.reply(getLang("expired"));
    }

    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
      return message.reply(getLang("successGlobal", newPrefix));
    }

    await threadsData.set(event.threadID, newPrefix, "data.prefix");
    return message.reply(getLang("successThisThread", newPrefix));
  }
};
