const axios = require('axios');

const SEARCH_API = 'https://lyric-search-neon.vercel.app/kshitiz?keyword=';

module.exports = {
  config: {
    name: 'tiktok',
    aliases: ['tt'],
    description: 'Search and download a TikTok video',
    usage: 'tiktok <search query>',
    cooldown: 10,
    role: 0,
    author: 'Neoaz',
    category: 'media'
  },

  async run({ api, event, args, logger }) {
    if (args.length === 0) {
      return api.sendMessage(
        '❌ Please provide a search query.\n\nUsage: tiktok <search query>',
        event.threadId
      );
    }

    const query = args.join(' ');
    await api.sendReaction('⏳', event.messageId);

    try {
      const res = await axios.get(`${SEARCH_API}${encodeURIComponent(query)}`, { timeout: 20000 });
      const results = res.data?.slice(0, 5);

      if (!results || results.length === 0) {
        await api.sendReaction('❌', event.messageId);
        return api.sendMessage(`❌ No TikTok videos found for: ${query}`, event.threadId);
      }

      const video = results[0];
      const videoUrl = video.videoUrl || video.video_url || video.play;

      if (!videoUrl) {
        await api.sendReaction('❌', event.messageId);
        return api.sendMessage('❌ Could not get a downloadable URL for this video.', event.threadId);
      }

      await api.sendVideoFromUrl(event.threadId, videoUrl, {
        caption: `🎵 ${video.title || query}\n👤 @${video.author?.unique_id || 'Unknown'}`
      });
      await api.sendReaction('✅', event.messageId);
    } catch (error) {
      logger.error('tiktok error', { error: error.message });
      await api.sendReaction('❌', event.messageId);
      return api.sendMessage(
        '❌ Failed to fetch TikTok video.\n\nThis could be due to:\n• No results found\n• API rate limit\n• Network error',
        event.threadId
      );
    }
  }
};
