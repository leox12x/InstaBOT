module.exports = {
  name: 'userinfo',
  aliases: ['uinfo', 'profile', 'iginfo'],
  description: 'Get detailed Instagram user information',
  usage: 'userinfo <username or UID>',
  cooldown: 10,
  role: 0,
  author: 'NeoKEX',
  category: 'utility',

  async run({ api, event, args, bot, logger }) {
    if (args.length === 0) {
      return api.sendMessage(
        '❌ Please provide a username or User ID!\n\n' +
        'Usage: userinfo <username or UID>\n' +
        'Examples:\n• userinfo instagram\n• userinfo 25025320',
        event.threadId
      );
    }

    const input = args[0].replace('@', '').trim();

    if (!input) {
      return api.sendMessage('❌ Please provide a valid username or User ID!', event.threadId);
    }

    const isUid = /^\d+$/.test(input);

    try {
      let userInfo;

      if (isUid) {
        userInfo = await bot.ig.getUserInfo(input);
      } else {
        userInfo = await bot.ig.getUserInfoByUsername(input);
      }

      if (!userInfo) {
        return api.sendMessage(
          `❌ User ${isUid ? input : '@' + input} not found!\n\n` +
          'This could be due to:\n' +
          '• User not found\n' +
          '• Account is private\n' +
          '• Instagram API rate limit\n' +
          '• Network error',
          event.threadId
        );
      }

      const userId    = userInfo.userID || userInfo.userId || input;
      const username  = userInfo.username || (isUid ? input : input);
      const fullName  = userInfo.fullName || 'N/A';
      const bio       = userInfo.bio || 'No bio';
      const isPrivate = userInfo.isPrivate ? '🔒 Private' : '🔓 Public';
      const isVerified = userInfo.isVerified ? '✅ Verified' : '❌ Not Verified';
      const followers = userInfo.followerCount ? userInfo.followerCount.toLocaleString() : 'N/A';
      const following = userInfo.followingCount ? userInfo.followingCount.toLocaleString() : 'N/A';
      const posts     = userInfo.mediaCount ? userInfo.mediaCount.toLocaleString() : 'N/A';

      let message = `Instagram User Info\n\n`;
      message += `👤 Username: @${username}\n`;
      message += `🆔 User ID: ${userId}\n`;
      message += `📝 Full Name: ${fullName}\n`;
      message += `${isPrivate}\n`;
      message += `${isVerified}\n\n`;
      message += `📊 Statistics:\n`;
      message += `  • Posts: ${posts}\n`;
      message += `  • Followers: ${followers}\n`;
      message += `  • Following: ${following}\n\n`;
      message += `📖 Bio:\n${bio}\n\n`;
      message += `🔗 Profile: https://instagram.com/${username}`;

      return api.sendMessage(message, event.threadId);

    } catch (error) {
      logger.error('Error in userinfo command', { error: error.message });
      return api.sendMessage(
        `❌ Error fetching user information for ${isUid ? input : '@' + input}\n\n` +
        'This could be due to:\n' +
        '• User not found\n' +
        '• Account is private\n' +
        '• Instagram API rate limit\n' +
        '• Network error',
        event.threadId
      );
    }
  }
};
