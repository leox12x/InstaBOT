const axios = require('axios');

const BASE_URL = 'https://noobs-api.top/dipto/baby';

module.exports = {
  config: {
    name: 'bby',
    aliases: ['baby', 'bbe', 'babe'],
    description: 'Chat with Baby AI — teach it, manage replies, and more',
    usage: 'bby <message> | teach <msg> - <reply> | remove <msg> | list | msg <msg>',
    cooldown: 3,
    role: 0,
    author: 'dipto',
    category: 'ai'
  },

  async run({ api, event, args, logger }) {
    if (args.length === 0) {
      const idle = ['Bolo baby 🥺', 'hum...', 'Type bby help', 'Ki bolbe?'];
      return api.sendMessage(idle[Math.floor(Math.random() * idle.length)], event.threadId);
    }

    const uid  = event.senderID;
    const text = args.join(' ').toLowerCase();

    try {
      // remove <msg>
      if (args[0] === 'remove') {
        const msg = text.replace('remove ', '');
        const res = await axios.get(`${BASE_URL}?remove=${encodeURIComponent(msg)}&senderID=${uid}`);
        return api.sendMessage(res.data.message, event.threadId);
      }

      // list
      if (args[0] === 'list') {
        const res = await axios.get(`${BASE_URL}?list=all`);
        const data = res.data;
        return api.sendMessage(
          `❇️ Total Teaches: ${data.length || 'N/A'}\n♻️ Total Responses: ${data.responseLength || 'N/A'}`,
          event.threadId
        );
      }

      // msg <msg>
      if (args[0] === 'msg') {
        const msg = text.replace('msg ', '');
        const res = await axios.get(`${BASE_URL}?list=${encodeURIComponent(msg)}`);
        return api.sendMessage(`Message "${msg}" → ${res.data.data}`, event.threadId);
      }

      // teach <msg> - <reply>
      if (args[0] === 'teach') {
        const parts = text.replace('teach ', '').split(/\s*-\s*/);
        if (parts.length < 2 || parts[1].length < 2) {
          return api.sendMessage('❌ Invalid format!\n\nUsage: bby teach <message> - <reply1>, <reply2>', event.threadId);
        }
        const [question, reply] = parts;
        const res = await axios.get(
          `${BASE_URL}?teach=${encodeURIComponent(question)}&reply=${encodeURIComponent(reply)}&senderID=${uid}`
        );
        return api.sendMessage(`✅ Taught!\n${res.data.message}`, event.threadId);
      }

      // regular chat
      const res = await axios.get(`${BASE_URL}?text=${encodeURIComponent(text)}&senderID=${uid}&font=1`);
      return api.sendMessage(res.data.reply || '...', event.threadId);

    } catch (error) {
      logger.error('bby error', { error: error.message });
      return api.sendMessage('❌ Baby AI is unavailable right now.', event.threadId);
    }
  }
};
