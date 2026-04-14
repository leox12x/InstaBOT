const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const SEARCH_API = 'https://neokex-dlapis.vercel.app/api/search';
const DL_API     = 'https://neokex-dlapis.vercel.app/api/alldl';

module.exports = {
  config: {
    name: 'ytb',
    aliases: ['youtube', 'yt'],
    description: 'Download YouTube video or audio',
    usage: 'ytb -v <query>  |  ytb -a <query>',
    cooldown: 15,
    role: 0,
    author: 'Neoaz',
    category: 'media'
  },

  async run({ api, event, args, logger }) {
    const type  = args[0];
    const query = args.slice(1).join(' ');

    if (!query || !['-v', '-a'].includes(type)) {
      return api.sendMessage(
        '❌ Invalid usage.\n\nUsage:\n• ytb -v <query> — video\n• ytb -a <query> — audio',
        event.threadId
      );
    }

    const dlType = type === '-a' ? 'audio' : 'video';
    await api.sendReaction('⏳', event.messageId);

    try {
      const searchRes = await axios.get(`${SEARCH_API}?q=${encodeURIComponent(query)}`, { timeout: 15000 });
      const results = searchRes.data?.results;

      if (!results || results.length === 0) {
        await api.sendReaction('❌', event.messageId);
        return api.sendMessage(`❌ No YouTube results found for: ${query}`, event.threadId);
      }

      const top = results[0];

      const dlRes = await axios.get(`${DL_API}?url=${encodeURIComponent(top.url)}`, { timeout: 30000 });
      const pollUrl = dlRes.data?.[dlType]?.downloadUrl;

      if (!pollUrl) throw new Error('No download URL returned.');

      let streamUrl = null;
      for (let i = 0; i < 60; i++) {
        const status = await axios.get(pollUrl, { timeout: 10000 });
        if (status.data?.status === 'completed') {
          streamUrl = status.data.viewUrl;
          break;
        }
        await new Promise(r => setTimeout(r, 1000));
      }

      if (!streamUrl) throw new Error('Processing timeout.');

      const tempDir  = path.join(process.cwd(), 'temp');
      await fs.ensureDir(tempDir);
      const ext      = dlType === 'audio' ? 'mp3' : 'mp4';
      const filePath = path.join(tempDir, `yt_${Date.now()}.${ext}`);

      const fileRes = await axios.get(streamUrl, { responseType: 'arraybuffer', timeout: 60000 });
      await fs.writeFile(filePath, Buffer.from(fileRes.data));

      if (dlType === 'audio') {
        await api.sendAudio(filePath, event.threadId);
      } else {
        await api.sendVideo(filePath, event.threadId);
      }

      await api.sendReaction('✅', event.messageId);
      fs.unlink(filePath).catch(() => {});
    } catch (error) {
      logger.error('ytb error', { error: error.message });
      await api.sendReaction('❌', event.messageId);
      return api.sendMessage(
        '❌ Failed to download from YouTube.\n\nThis could be due to:\n• Video unavailable\n• API timeout\n• Network error',
        event.threadId
      );
    }
  }
};
