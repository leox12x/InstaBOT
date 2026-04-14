module.exports = {
  name: 'uid',
  aliases: ['userid', 'getuid', 'id'],
  description: 'Get Instagram User ID from username',
  usage: 'uid [username or UID]',
  cooldown: 5,
  role: 0,
  author: 'NeoKEX',
  category: 'utility',

  async run({ api, event, args, bot, logger }) {
    if (args.length === 0) {
      return api.sendMessage(String(event.senderID), event.threadId);
    }

    const input = args[0].replace('@', '').trim();

    if (!input) {
      return api.sendMessage('❌ Please provide a valid username or User ID!\n\nUsage: uid <username or UID>', event.threadId);
    }

    // Already a UID — return it immediately
    if (/^\d+$/.test(input)) {
      return api.sendMessage(input, event.threadId);
    }

    try {
      const userInfo = await bot.ig.getUserInfoByUsername(input);

      if (!userInfo) {
        return api.sendMessage(`❌ User @${input} not found!`, event.threadId);
      }

      const userId = userInfo.userID || userInfo.userId;
      return api.sendMessage(String(userId), event.threadId);

    } catch (searchError) {
      try {
        const searchResults = await bot.ig.searchUsers(input);

        if (!searchResults || searchResults.length === 0) {
          return api.sendMessage(`❌ User @${input} not found!`, event.threadId);
        }

        const userId = searchResults[0].userID || searchResults[0].userId;
        return api.sendMessage(String(userId), event.threadId);

      } catch (error2) {
        logger.error('Error in uid command', { error: error2.message });
        return api.sendMessage(
          `❌ Error fetching User ID for @${input}\n\n` +
          'This could be due to:\n' +
          '• User not found\n' +
          '• Account is private\n' +
          '• Instagram API rate limit\n' +
          '• Network error',
          event.threadId
        );
      }
    }
  }
};
