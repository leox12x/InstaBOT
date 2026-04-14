const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

module.exports = {
  config: {
    name: 'shell',
    aliases: ['sh', 'exec'],
    description: 'Execute shell commands on the host (Developer only)',
    usage: 'shell <command>',
    cooldown: 5,
    role: 4,
    author: 'NeoKEX',
    category: 'owner'
  },

  async run({ api, event, args, logger }) {
    const command = args.join(' ');

    if (!command) {
      return api.sendMessage('❌ Please provide a command.\n\nUsage: shell <command>\nExample: shell ls -la', event.threadId);
    }

    try {
      const { stdout, stderr } = await execPromise(command, {
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 10
      });

      let out = '';
      if (stdout) out += stdout;
      if (stderr) out += stderr;
      if (!out) out = 'Command executed successfully (no output)';
      if (out.length > 2000) out = out.substring(0, 1997) + '...';

      return api.sendMessage(`✓ Output:\n\n${out}`, event.threadId);
    } catch (error) {
      logger.error('shell error', { error: error.message });
      const msg = error.message.includes('ETIMEDOUT') || error.message.includes('timeout')
        ? '⚠️ Command execution timed out (30s limit)'
        : `✗ Error:\n\n${error.message.substring(0, 1997)}`;
      return api.sendMessage(msg, event.threadId);
    }
  }
};
