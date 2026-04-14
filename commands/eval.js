module.exports = {
  config: {
    name: 'eval',
    aliases: ['ev', 'js'],
    description: 'Execute JavaScript code in the bot context (Developer only)',
    usage: 'eval <code>',
    cooldown: 0,
    role: 4,
    author: 'NTKhang',
    category: 'owner'
  },

  async run({ api, event, args, bot, logger, config }) {
    const code = args.join(' ');

    if (!code) {
      return api.sendMessage('❌ Please provide code to execute.\n\nUsage: eval <code>', event.threadId);
    }

    function output(msg) {
      if (typeof msg === 'number' || typeof msg === 'boolean' || typeof msg === 'function') {
        return msg.toString();
      } else if (typeof msg === 'undefined') {
        return 'undefined';
      } else if (typeof msg === 'object') {
        try { return JSON.stringify(msg, null, 2); } catch (_) { return String(msg); }
      }
      return String(msg);
    }

    try {
      let result = eval(`(async () => { ${code} })()`);
      if (result && typeof result.then === 'function') {
        result = await result;
      }

      const text = result !== undefined ? output(result) : '✅ Executed (no return value)';
      const trimmed = text.length > 2000 ? text.substring(0, 1997) + '...' : text;

      return api.sendMessage(`✓ Output:\n\n${trimmed}`, event.threadId);
    } catch (error) {
      logger.error('eval error', { error: error.message });
      const errText = (error.stack || error.message || String(error)).substring(0, 1997);
      return api.sendMessage(`✗ Error:\n\n${errText}`, event.threadId);
    }
  }
};
