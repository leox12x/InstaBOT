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

  async run({ api, event, args, bot, globalData, threadsData, permission, logger }) {
    try {
      const threadID = event.threadId;
      const senderID = event.senderId;
      const aliasesData = await threadsData.get(threadID, 'data.aliases', {});

      const action = args[0]?.toLowerCase();

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
        if (!bot.commandLoader.hasCommand(commandName)) {
          return api.sendMessage(`❌ Command "${commandName}" does not exist!`, threadID);
        }

        // Check if alias is already a command
        if (bot.commandLoader.hasCommand(alias)) {
          return api.sendMessage(`❌ "${alias}" is already a command name!`, threadID);
        }

        if (isGlobal) {
          // Check permission for global alias
          const userRole = permission.getUserRole(senderID);
          if (userRole < 2) {
            return api.sendMessage('❌ Only bot admins can add global aliases!', threadID);
          }

          // Check if alias already exists globally
          const globalAliases = await globalData.get('setalias', 'data', []);
          const existingGlobal = globalAliases.find(a => a.aliases.includes(alias));
          if (existingGlobal) {
            return api.sendMessage(`❌ Alias "${alias}" already exists for command "${existingGlobal.commandName}"!`, threadID);
          }

          // Check bot's global aliases
          if (bot.aliases.has(alias)) {
            return api.sendMessage(`❌ Alias "${alias}" already exists globally for "${bot.aliases.get(alias)}"!`, threadID);
          }

          // Add global alias
          const cmdAliases = globalAliases.find(a => a.commandName === commandName);
          if (cmdAliases) {
            cmdAliases.aliases.push(alias);
          } else {
            globalAliases.push({ commandName, aliases: [alias] });
          }

          await globalData.set('setalias', globalAliases, 'data');
          bot.aliases.set(alias, commandName);

          return api.sendMessage(`✅ Global alias added!\n\n📝 "${alias}" → "${commandName}"`, threadID);
        }

        // Add group alias
        const existingInGroup = Object.entries(aliasesData).find(([cmd, als]) => als.includes(alias));
        if (existingInGroup) {
          return api.sendMessage(`❌ Alias "${alias}" already exists for "${existingInGroup[0]}" in this group!`, threadID);
        }

        const oldAlias = aliasesData[commandName] || [];
        oldAlias.push(alias);
        aliasesData[commandName] = oldAlias;
        await threadsData.set(threadID, aliasesData, 'data.aliases');

        return api.sendMessage(`✅ Alias added in this group!\n\n📝 "${alias}" → "${commandName}"`, threadID);
      }

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

        if (!bot.commandLoader.hasCommand(commandName)) {
          return api.sendMessage(`❌ Command "${commandName}" does not exist!`, threadID);
        }

        if (isGlobal) {
          const userRole = permission.getUserRole(senderID);
          if (userRole < 2) {
            return api.sendMessage('❌ Only bot admins can remove global aliases!', threadID);
          }

          const globalAliases = await globalData.get('setalias', 'data', []);
          const cmdAliases = globalAliases.find(a => a.commandName === commandName);

          if (!cmdAliases || !cmdAliases.aliases.includes(alias)) {
            return api.sendMessage(`❌ Alias "${alias}" not found for "${commandName}"!`, threadID);
          }

          cmdAliases.aliases.splice(cmdAliases.aliases.indexOf(alias), 1);
          await globalData.set('setalias', globalAliases, 'data');
          bot.aliases.delete(alias);

          return api.sendMessage(`✅ Global alias removed!\n\n📝 "${alias}" → "${commandName}"`, threadID);
        }

        // Remove group alias
        const oldAlias = aliasesData[commandName];
        if (!oldAlias || !oldAlias.includes(alias)) {
          return api.sendMessage(`❌ Alias "${alias}" not found for "${commandName}" in this group!`, threadID);
        }

        oldAlias.splice(oldAlias.indexOf(alias), 1);
        await threadsData.set(threadID, aliasesData, 'data.aliases');

        return api.sendMessage(`✅ Alias removed from this group!\n\n📝 "${alias}" → "${commandName}"`, threadID);
      }

      if (action === 'list') {
        if (args[1] === '-g') {
          const globalAliases = await globalData.get('setalias', 'data', []);
          if (!globalAliases.length) {
            return api.sendMessage('📋 No global aliases set!', threadID);
          }

          let msg = '📋 Global Aliases:\n\n';
          globalAliases.forEach(({ commandName, aliases }) => {
            msg += `• ${commandName}: ${aliases.join(', ')}\n`;
          });
          return api.sendMessage(msg, threadID);
        }

        const entries = Object.entries(aliasesData);
        if (!entries.length) {
          return api.sendMessage('📋 No aliases in this group!', threadID);
        }

        let msg = '📋 Aliases in this group:\n\n';
        entries.forEach(([commandName, aliasList]) => {
          msg += `• ${commandName}: ${aliasList.join(', ')}\n`;
        });
        return api.sendMessage(msg, threadID);
      }

      // No valid action
      return api.sendMessage(
        '❌ Invalid action!\n\nUsage:\n• setalias add <alias> <command> - Add alias\n• setalias remove <alias> <command> - Remove alias\n• setalias list - List aliases\n• setalias list -g - List global aliases',
        threadID
      );

    } catch (error) {
      logger.error('setalias error:', error);
      return api.sendMessage('❌ Error in setalias command!', event.threadId);
    }
  }
};