module.exports = {
  config: {
    name: 'setalias',
    version: '1.8',
    aliases: ['alias'],
    description: 'Add/remove aliases for commands in your group',
    usage: 'setalias add/remove/list [alias] [command]',
    cooldown: 5,
    role: 0,
    author: 'Rahman Leon',
    category: 'config'
  },

  async run({ api, event, args, bot, database, config, PermissionManager, logger }) {
    try {
      const threadID = event.threadId;
      const senderID = event.senderId;

      // Get aliases from database
      const threadData = database.getThreadData(threadID);
      const aliasesData = threadData.aliases || {};

      // Global aliases stored in config (admin managed)
      const globalAliases = config.GLOBAL_ALIASES || {};

      const action = args[0]?.toLowerCase();

      // ── ADD ALIAS ──────────────────────────────────────────────────────
      if (action === 'add') {
        if (!args[1] || !args[2]) {
          return api.sendMessage(
            '❌ Wrong syntax!\n\nUsage:\n• setalias add <alias> <command>\n• setalias add <alias> <command> -g (global, admin only)',
            threadID
          );
        }

        const alias = args[1].toLowerCase();
        const commandName = args[2].toLowerCase();
        const isGlobal = args[3] === '-g';

        // Check if command exists
        if (!bot.commandLoader.getCommand(commandName)) {
          return api.sendMessage(`❌ Command "${commandName}" does not exist!`, threadID);
        }

        // Check if alias is already a command name
        if (bot.commandLoader.getCommand(alias)) {
          return api.sendMessage(`❌ "${alias}" is already a command name!`, threadID);
        }

        if (isGlobal) {
          // Global alias - requires admin role
          const userRole = PermissionManager.getUserRole(senderID);
          if (userRole < 2) {
            return api.sendMessage('❌ Only bot admins can add global aliases!', threadID);
          }

          // Check if alias exists in any global command
          for (const [cmd, als] of Object.entries(globalAliases)) {
            if (als.includes(alias)) {
              return api.sendMessage(`❌ Alias "${alias}" already exists for "${cmd}"!`, threadID);
            }
          }

          // Add to global aliases
          if (!globalAliases[commandName]) {
            globalAliases[commandName] = [];
          }
          if (!globalAliases[commandName].includes(alias)) {
            globalAliases[commandName].push(alias);
          }

          // Also register in bot's alias system
          bot.aliases = bot.aliases || new Map();
          bot.aliases.set(alias, commandName);

          // Save to config
          config.GLOBAL_ALIASES = globalAliases;
          database.save();

          return api.sendMessage(`✅ Global alias added!\n\n📝 "${alias}" → "${commandName}"`, threadID);
        }

        // Group alias
        const existingEntry = Object.entries(aliasesData).find(([cmd, als]) => als.includes(alias));
        if (existingEntry) {
          return api.sendMessage(`❌ Alias "${alias}" already exists for "${existingEntry[0]}" in this group!`, threadID);
        }

        if (!aliasesData[commandName]) {
          aliasesData[commandName] = [];
        }
        aliasesData[commandName].push(alias);

        database.setThreadData(threadID, { aliases: aliasesData });

        return api.sendMessage(`✅ Alias added in this group!\n\n📝 "${alias}" → "${commandName}"`, threadID);
      }

      // ── REMOVE ALIAS ───────────────────────────────────────────────────
      if (action === 'remove' || action === 'rm') {
        if (!args[1] || !args[2]) {
          return api.sendMessage(
            '❌ Wrong syntax!\n\nUsage:\n• setalias remove <alias> <command>\n• setalias remove <alias> <command> -g (global, admin only)',
            threadID
          );
        }

        const alias = args[1].toLowerCase();
        const commandName = args[2].toLowerCase();
        const isGlobal = args[3] === '-g';

        if (!bot.commandLoader.getCommand(commandName)) {
          return api.sendMessage(`❌ Command "${commandName}" does not exist!`, threadID);
        }

        if (isGlobal) {
          const userRole = PermissionManager.getUserRole(senderID);
          if (userRole < 2) {
            return api.sendMessage('❌ Only bot admins can remove global aliases!', threadID);
          }

          const cmdAliases = globalAliases[commandName];
          if (!cmdAliases || !cmdAliases.includes(alias)) {
            return api.sendMessage(`❌ Alias "${alias}" not found for "${commandName}"!`, threadID);
          }

          const idx = cmdAliases.indexOf(alias);
          cmdAliases.splice(idx, 1);
          if (cmdAliases.length === 0) {
            delete globalAliases[commandName];
          }

          // Remove from bot's alias system
          if (bot.aliases) {
            bot.aliases.delete(alias);
          }

          config.GLOBAL_ALIASES = globalAliases;
          database.save();

          return api.sendMessage(`✅ Global alias removed!\n\n📝 "${alias}" → "${commandName}"`, threadID);
        }

        // Remove group alias
        const cmdAliases = aliasesData[commandName];
        if (!cmdAliases || !cmdAliases.includes(alias)) {
          return api.sendMessage(`❌ Alias "${alias}" not found for "${commandName}" in this group!`, threadID);
        }

        const idx = cmdAliases.indexOf(alias);
        cmdAliases.splice(idx, 1);
        if (cmdAliases.length === 0) {
          delete aliasesData[commandName];
        }

        database.setThreadData(threadID, { aliases: aliasesData });

        return api.sendMessage(`✅ Alias removed from this group!\n\n📝 "${alias}" → "${commandName}"`, threadID);
      }

      // ── LIST ALIASES ────────────────────────────────────────────────────
      if (action === 'list') {
        if (args[1] === '-g') {
          const entries = Object.entries(globalAliases);
          if (!entries.length) {
            return api.sendMessage('📋 No global aliases set!', threadID);
          }

          let msg = '📋 Global Aliases:\n\n';
          entries.forEach(([commandName, aliasList]) => {
            msg += `• ${commandName}: ${aliasList.join(', ')}\n`;
          });
          return api.sendMessage(msg, threadID);
        }

        const entries = Object.entries(aliasesData);
        if (!entries.length) {
          return api.sendMessage('📋 No aliases in this group!\n\nUse: setalias add <alias> <command>', threadID);
        }

        let msg = '📋 Aliases in this group:\n\n';
        entries.forEach(([commandName, aliasList]) => {
          msg += `• ${commandName}: ${aliasList.join(', ')}\n`;
        });
        return api.sendMessage(msg, threadID);
      }

      // ── INVALID ACTION ─────────────────────────────────────────────────
      return api.sendMessage(
        '❌ Invalid action!\n\nUsage:\n• setalias add <alias> <command> - Add alias\n• setalias add <alias> <command> -g - Add global alias\n• setalias remove <alias> <command> - Remove alias\n• setalias list - List group aliases\n• setalias list -g - List global aliases',
        threadID
      );

    } catch (error) {
      logger.error('setalias error:', error);
      return api.sendMessage('❌ Error in setalias command!', event.threadId);
    }
  }
};