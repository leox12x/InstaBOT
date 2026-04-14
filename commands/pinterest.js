const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'pinterest',
    aliases: ['pin', 'pins'],
    description: 'Search Pinterest for images',
    usage: 'pinterest <query> [-count]  (e.g. pinterest anime -5)',
    cooldown: 10,
    role: 0,
    author: 'Mahi--',
    category: 'media'
  },

  async run({ api, event, args, logger }) {
    if (args.length === 0) {
      return api.sendMessage(
        '❌ Please provide a search query.\n\nUsage: pinterest <query> [-count]\nExample: pinterest anime wallpaper -4',
        event.threadId
      );
    }

    let count = 3;
    const countArg = args.find(a => /^-\d+$/.test(a));
    if (countArg) {
      count = Math.min(Math.max(parseInt(countArg.slice(1), 10), 1), 9);
      args = args.filter(a => a !== countArg);
    }

    const query = args.join(' ').trim();
    await api.sendReaction('⏳', event.messageId);

    try {
      const res = await axios.get(
        `https://egret-driving-cattle.ngrok-free.app/api/pin?query=${encodeURIComponent(query)}&num=20`,
        { timeout: 15000 }
      );

      const urls = (res.data?.results || []).slice(0, count);

      if (urls.length === 0) {
        await api.sendReaction('❌', event.messageId);
        return api.sendMessage(`❌ No images found for: ${query}`, event.threadId);
      }

      await api.sendMessage(
        `🖼️ Found images for "${query}" — sending ${urls.length}...`,
        event.threadId
      );

      const tempDir = path.join(process.cwd(), 'temp');
      await fs.ensureDir(tempDir);

      for (let i = 0; i < urls.length; i++) {
        try {
          const imgRes = await axios.get(urls[i], { responseType: 'arraybuffer', timeout: 15000 });
          const filePath = path.join(tempDir, `pin_${Date.now()}_${i}.jpg`);
          await fs.writeFile(filePath, Buffer.from(imgRes.data));
          await api.sendPhoto(filePath, event.threadId);
          fs.unlink(filePath).catch(() => {});
        } catch (_) {}
      }

      await api.sendReaction('✅', event.messageId);
    } catch (error) {
      logger.error('pinterest error', { error: error.message });
      await api.sendReaction('❌', event.messageId);
      return api.sendMessage(
        '❌ Failed to fetch Pinterest images.\n\nThis could be due to:\n• API rate limit\n• Network error\n• No results found',
        event.threadId
      );
    }
  }
};
