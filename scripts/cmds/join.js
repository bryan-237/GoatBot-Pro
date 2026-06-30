module.exports = {
  config: {
    name: "join",
    version: "4.0",
    author: "Big Bryan",
    countDown: 5,
    role: 2, // 2 = Bot Admin only
    dev: true,
    shortDescription: { en: "List groups + get join link" },
    description: { en: "Paginated group list. Reply with number to get invite link" },
    category: "owner",
    guide: { en: "{p}{n} [page|next|prev]" }
  },

  onStart: async function ({ api, event, args, threadsData }) {
    try {
      const { threadID } = event;
      const prefix = await threadsData.get(threadID, "data.prefix") || global.GoatBot.config.prefix || "?";

      const groupList = await api.getThreadList(100, null, ["INBOX"]);
      const filteredList = groupList.filter(g => g.isGroup && g.isSubscribed);
      if (!filteredList.length) return api.sendMessage("❌ No group found.", threadID);

      const pageSize = 10;
      const totalPages = Math.ceil(filteredList.length / pageSize);
      if (!global.joinPage) global.joinPage = {};

      let page = 1;
      if (args[0]) {
        const input = args[0].toLowerCase();
        if (input === "next") page = (global.joinPage[threadID] || 1) + 1;
        else if (input === "prev") page = (global.joinPage[threadID] || 1) - 1;
        else page = parseInt(input) || 1;
      }
      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;
      global.joinPage[threadID] = page;

      const startIndex = (page - 1) * pageSize;
      const currentGroups = filteredList.slice(startIndex, startIndex + pageSize);

      const formatted = currentGroups.map((g, i) =>
        `┃ ${startIndex + i + 1}. ${g.threadName || "Unnamed Group"}\n┃ 👥 ${g.participantIDs.length} members\n┃`
      ).join("\n");

      const body = [
        "╭─────────────❃",
        "│ 🤝 GROUP LIST",
        "│──────────────────",
        formatted,
        "│──────────────────",
        `│ 📄 Page ${page}/${totalPages} | Total: ${filteredList.length}`,
        "│ ⚠️ Facebook blocks direct add. Use invite link.",
        "╰───────────────✦",
        ``,
        `👉 Reply with the number to get invite link.`
      ].join("\n");

      const sentMessage = await api.sendMessage(body, threadID);
      global.GoatBot.onReply.set(sentMessage.messageID, {
        commandName: "join",
        author: event.senderID,
        list: filteredList,
        page,
        pageSize
      });

    } catch (e) {
      console.error(e);
      api.sendMessage("⚠️ Error getting group list.", event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { author, list, page, pageSize } = Reply;
    if (event.senderID!== author) return;

    const groupIndex = parseInt(event.body, 10);
    if (isNaN(groupIndex) || groupIndex <= 0) {
      return api.sendMessage("⚠️ Invalid number.", event.threadID, event.messageID);
    }

    const startIndex = (page - 1) * pageSize;
    const currentGroups = list.slice(startIndex, startIndex + pageSize);
    if (groupIndex > currentGroups.length) {
      return api.sendMessage("⚠️ Number out of range.", event.threadID, event.messageID);
    }

    try {
      const selected = currentGroups[groupIndex - 1];
      const groupID = selected.threadID;
      const members = await api.getThreadInfo(groupID);

      if (members.participantIDs.includes(event.senderID)) {
        return api.sendMessage(`⚠️ You are already in 『${selected.threadName}』`, event.threadID, event.messageID);
      }
      if (members.participantIDs.length >= 250) {
        return api.sendMessage(`🚫 Group full: 『${selected.threadName}』`, event.threadID, event.messageID);
      }

      // Messenger n'a plus de lien auto. Donc on demande à un admin de te rajouter
      await api.sendMessage(
        `📨 Demande d'ajout pour ${event.senderID}\nGroupe: ${selected.threadName}\nID: ${groupID}\n\nUn admin doit t'ajouter manuellement.`,
        groupID
      );
      api.sendMessage(`✅ Demande envoyée aux admins de 『${selected.threadName}』\nFB bloque l'ajout auto depuis 2024.`, event.threadID, event.messageID);

    } catch (e) {
      console.error(e);
      api.sendMessage("⚠️ Failed. The bot must be admin of that group.", event.threadID, event.messageID);
    } finally {
      global.GoatBot.onReply.delete(event.messageID);
    }
  }
};
