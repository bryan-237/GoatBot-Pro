const { commands, aliases } = global.GoatBot;

// --- Fonction 𝑨𝒁 Style ---
function toAZStyle(text) {
  const azMap = {
    A:'𝑨', B:'𝑩', C:'𝑪', D:'𝑫', E:'𝑬', F:'𝑭', G:'𝑮', H:'𝑯', I:'𝑰', J:'𝑱', K:'𝑲', L:'𝑳', M:'𝑴',
    N:'𝑵', O:'𝑶', P:'𝑷', Q:'𝑸', R:'𝑹', S:'𝑺', T:'𝑻', U:'𝑼', V:'𝑽', W:'𝑾', X:'𝑿', Y:'𝒀', Z:'𝒁',
    a:'𝒂', b:'𝒃', c:'𝒄', d:'𝒅', e:'𝒆', f:'𝒇', g:'𝒈', h:'𝒉', i:'𝒊', j:'𝒋', k:'𝒌', l:'𝒍', m:'𝒎',
    n:'𝒏', o:'𝒐', p:'𝒑', q:'𝒒', r:'𝒓', s:'𝒔', t:'𝒕', u:'𝒖', v:'𝒗', w:'𝒘', x:'𝒙', y:'𝒚', z:'𝒛',
    '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9', ' ':' '
  };
  return text.split('').map(c => azMap[c] || c).join('');
}

module.exports = {
  config: {
    name: "help",
    version: "5.3",
    author: "Big Bryan",
    countDown: 2,
    role: 0,
    shortDescription: { en: "Explore all bot commands" },
    description: { en: "Show command list, info, and AI search" },
    category: "info",
    guide: { en: "{pn} <command> | -ai <keyword> | -s <keyword>" }
  },

  onStart: async function ({ message, args, event, threadsData }) {
    try {
      const { threadID } = event;
      const prefix = await threadsData.get(threadID, "data.prefix") || global.GoatBot.config.prefix || "?";

      // --- AI Suggestion ---
      if(args[0]?.toLowerCase() === "-ai") {
        const keyword = args[1]?.toLowerCase() || "";
        const allCmds = Array.from(commands.keys());
        const suggestions = allCmds
         .filter(cmd => cmd.includes(keyword))
         .sort((a,b)=> a.length - b.length)
         .slice(0,10);

        if(!suggestions.length) return message.reply(`❌ No suggestions found for "${keyword}".`);

        const body = [
          "🤖 𝐀𝐈 𝐒𝐮𝐠𝐞𝐬𝐭𝐢𝐨𝐧𝐬:",
         ...suggestions.map(s=>`• ${toAZStyle(s)}`)
        ].join("\n");
        return message.reply(body);
      }

      // --- Search ---
      if(args[0]?.toLowerCase() === "-s") {
        const keyword = args[1]?.toLowerCase() || "";
        const result = Array.from(commands.keys()).filter(cmd => cmd.includes(keyword));
        if(!result.length) return message.reply(`❌ No command found for "${keyword}".`);
        return message.reply(`🔍 𝐑𝐞𝐬𝐮𝐥𝐭𝐬 𝐟𝐨𝐫 "${keyword}":\n${result.map(r=>`• ${toAZStyle(r)}`).join("\n")}`);
      }

      // --- Command List ---
      if(!args || args.length === 0) {
        let body = "📚 𝐆𝐎𝐀𝐓 𝐁𝐎𝐓 𝐂𝐎𝐌𝐀𝐍𝐃𝐒\n";
        const categories = {};
        for(let [name, cmd] of commands) {
          const cat = cmd.config.category || "Misc";
          if(!categories[cat]) categories[cat] = [];
          categories[cat].push(name);
        }
        for(const cat of Object.keys(categories).sort()) {
          const list = categories[cat].sort().map(c=>`• ${toAZStyle(c)}`).join("\n");
          body += `🍂 ${toAZStyle(cat)}\n${list}\n\n`;
        }
        body += `📊 𝐓𝐨𝐭𝐚𝐥 𝐂𝐨𝐦𝐚𝐧𝐝𝐬: ${commands.size}\n`;
        body += `🔧 𝐈𝐧𝐟𝐨: ${prefix}help <command>\n`;
        body += `🔍 𝐒𝐞𝐚𝐫𝐜𝐡: ${prefix}help -s <keyword>\n`;
        body += `🤖 𝐀𝐈: ${prefix}help -ai <keyword>`;
        return message.reply(body);
      }

      // --- Command Info ---
      const query = args[0].toLowerCase();
      const command = commands.get(query) || commands.get(aliases.get(query));
      if(!command) return message.reply(`❌ Command "${query}" not found.`);

      const cfg = command.config || {};
      const roleMap = {0:"𝐀𝐥 𝐔𝐬𝐞𝐫𝐬",1:"𝐆𝐫𝐨𝐮𝐩 𝐀𝐝𝐦𝐢𝐧𝐬",2:"𝐁𝐨𝐭 𝐀𝐝𝐦𝐢𝐧𝐬"};
      const aliasesList = Array.isArray(cfg.aliases) && cfg.aliases.length? cfg.aliases.map(a=>toAZStyle(a)).join(", ") : "𝐍𝐨𝐧𝐞";
      const desc = cfg.description?.en || "No description.";
      const usage = cfg.guide?.en || `${prefix}${cfg.name}`;

      const card = [
        `✨ ${toAZStyle(cfg.name)} ✨`,
        `📝 𝐃𝐞𝐬𝐜𝐫𝐢𝐩𝐭𝐢𝐨𝐧: ${desc}`,
        `📂 𝐂𝐚𝐭𝐞𝐠𝐨𝐫𝐲: ${toAZStyle(cfg.category || "Misc")}`,
        `🔤 𝐀𝐥𝐢𝐚𝐬𝐞𝐬: ${aliasesList}`,
        `🛡️ 𝐑𝐨𝐥𝐞: ${roleMap[cfg.role] || "Unknown"} | ⏱️ 𝐂𝐨𝐥𝐝𝐨𝐰𝐧: ${cfg.countDown || 1}s`,
        `🚀 𝐕𝐞𝐫𝐬𝐢𝐨𝐧: ${cfg.version || "1.0"} | 👨‍💻 𝐀𝐮𝐭𝐡𝐨𝐫: ${cfg.author || "Unknown"}`,
        `💡 𝐔𝐬𝐚𝐠𝐞: ${toAZStyle(usage)}`
      ].join("\n");
      return message.reply(card);

    } catch(err) {
      console.error("HELP CMD ERROR:", err);
      return message.reply(`⚠️ Error: ${err.message || err}`);
    }
  }
};
