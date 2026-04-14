const axios = require('axios');
const FormData = require('form-data');

const IMGBB_API_KEY = '1b4d99fa0c3195efe42ceb62670f2a25';

module.exports = {
  config: {
    name: 'imgbb',
    aliases: ['uploadimg', 'imgupload'],
    description: 'Upload image(s) to imgbb and get permanent links',
    usage: 'imgbb (send with image attachment)',
    cooldown: 5,
    role: 0,
    author: 'xnil6x',
    category: 'utility'
  },

  async run({ api, event, logger }) {
    const attachments = (event.attachments || []).filter(a =>
      a.type === 'photo' || a.type === 'image' || (a.url && /\.(jpg|jpeg|png|gif|webp)/i.test(a.url))
    );

    if (attachments.length === 0) {
      return api.sendMessage(
        '❌ No image found!\n\nSend your image together with the imgbb command.',
        event.threadId
      );
    }

    await api.sendReaction('⏳', event.messageId);

    try {
      const links = await Promise.all(
        attachments.map(async (att, i) => {
          const imgRes = await axios.get(att.url, { responseType: 'arraybuffer' });
          const form = new FormData();
          form.append('image', Buffer.from(imgRes.data, 'binary'), { filename: `image${i}.jpg` });

          const res = await axios.post('https://api.imgbb.com/1/upload', form, {
            headers: form.getHeaders(),
            params: { key: IMGBB_API_KEY }
          });

          return res.data.data.url;
        })
      );

      await api.sendReaction('✅', event.messageId);
      return api.sendMessage(
        `🖼️ Uploaded ${links.length} image(s):\n\n${links.join('\n')}`,
        event.threadId
      );
    } catch (error) {
      logger.error('imgbb error', { error: error.message });
      await api.sendReaction('❌', event.messageId);
      return api.sendMessage('❌ Failed to upload image(s) to imgbb.', event.threadId);
    }
  }
};
