module.exports = {
  config: {
    name: "help",
    version: "1.0",
    author: "BRYAN SABIN | XENOZ",
    countDown: 5,
    role: 0,
    description: "Menu d'aide façon Claude AI",
    category: "⚙️ Configuration",
    guide: {
      en: "{pn} : shows all commands\n{pn} <command> : shows detail of a command"
    }
  },

  onStart: async function ({ message, args, threadsData, event }) {
    const commands = global.GoatBot.commands;
    const threadPrefix = await threadsData.get(event.threadID, "data.prefix") || global.GoatBot.config.prefix;

    // --- Vue détaillée d'une commande ---
    if (args[0]) {
      const cmd = commands.get(args[0].toLowerCase());
      if (!cmd) {
        return message.reply(
          `🤖 Hmm... je ne trouve pas "${args[0]}" dans mes fichiers 😈\n` +
          `➥ Tape ${threadPrefix}help pour voir tout ce que je sais faire.`
        );
      }

      const guide = cmd.config.guide?.en
        ? cmd.config.guide.en.replace(/{pn}/g, threadPrefix + cmd.config.name)
        : "Pas de guide fourni pour cette commande.";

      return message.reply(
        "✦ ────────────────── ✦\n" +
        `  🧠  ${cmd.config.name.toUpperCase()}\n` +
        "✦ ────────────────── ✦\n" +
        `📁 Catégorie   : ${cmd.config.category || "N/A"}\n` +
        `📝 Description : ${cmd.config.description || "N/A"}\n` +
        `⏱️ Cooldown    : ${cmd.config.countDown || 0}s\n` +
        `🔑 Rôle requis : ${cmd.config.role || 0}\n` +
        "── Comment l'utiliser ──\n" +
        `${guide}\n\n` +
        "❤️ Utilise-la bien, je veille au grain."
      );
    }

    // --- Vue globale groupée par catégorie ---
    const categories = {};
    for (const [, cmd] of commands) {
      const cat = cmd.config.category || "Autre";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd.config.name);
    }

    const intros = [
      "Alors, on fait quoi aujourd'hui ? 😎",
      "Je suis à ton service. Voici tout ce que je peux faire 😈",
      "Prêt à en découdre ? Voilà mon arsenal ❤️"
    ];
    const intro = intros[Math.floor(Math.random() * intros.length)];

    let body = "🧠 ═══ MODE CLAUDE ═══ 🧠\n";
    body += `${intro}\n\n`;

    const sortedCats = Object.keys(categories).sort();
    for (const cat of sortedCats) {
      body += `◆ ${cat}\n`;
      const list = categories[cat].sort();
      body += list.map(c => `   ↳ ${threadPrefix}${c}`).join("\n");
      body += "\n\n";
    }

    body += "──────────────────\n";
    body += `📦 ${commands.size} commandes chargées\n`;
    body += `🔍 ${threadPrefix}help <commande> pour les détails\n`;
    body += "──────────────────\n";
    body += "🤖 Toujours honnête, parfois taquin, jamais méchant 😈❤️";

    return message.reply(body);
  }
};
