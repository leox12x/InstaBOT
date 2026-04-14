const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const API_ENDPOINT = 'https://neokex-img-api.vercel.app/generate';

module.exports = {
  config: {
    name: 'imagen4',
    aliases: ['img4', 'gen4'],
    description: 'Generate a high-quality image using the Imagen 4 model',
    usage: 'imagen4 <prompt>',
    cooldown: 15,
    role: 0,
    author: 'NeoKEX',
    category: 'ai'
  },

  async run({ api, event, args, logger }) {
    const prompt = args.join(' ').trim();

    if (!prompt) {
      return api.sendMessage(
        '❌ Please provide a prompt.\n\nUsage: imagen4 <prompt>\nExample: imagen4 a sunset over mountains in watercolor',
        event.threadId
      );
    }

    await api.sendReaction('🎨', event.messageId);

    const tempDir  = path.join(process.cwd(), 'temp');
    await fs.ensureDir(tempDir);
    const filePath = path.join(tempDir, `imagen4_${Date.now()}.png`);

    try {
      const res = await axios.get(
        `${API_ENDPOINT}?prompt=${encodeURIComponent(prompt)}&m=imagen4`,
        { responseType: 'stream', timeout: 60000 }
      );

      const writer = fs.createWriteStream(filePath);
      res.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      await api.sendPhoto(filePath, event.threadId);
      await api.sendReaction('✅', event.messageId);
      fs.unlink(filePath).catch(() => {});
    } catch (error) {
      logger.error('imagen4 error', { error: error.message });
      await api.sendReaction('❌', event.messageId);
      fs.unlink(filePath).catch(() => {});

      const msg = error.code === 'ECONNABORTED'
        ? '❌ Request timed out. The server is taking too long.'
        : '❌ Failed to generate image. Please try again.';
      return api.sendMessage(msg, event.threadId);
    }
  }
};
