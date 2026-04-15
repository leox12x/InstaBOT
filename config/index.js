const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

let c = {};
const configPath = path.resolve(__dirname, 'default.json');

try {
  if (fs.existsSync(configPath)) {
    c = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (error) {
  console.error('Error loading config/default.json:', error.message);
}

const pkg = (() => {
  try { return require('../package.json'); } catch (_) { return {}; }
})();

module.exports = {
  // ── Bot identity ──────────────────────────────────────────────────────
  BOT_NAME:    c.nickNameBot || 'InstaBOT',
  BOT_VERSION: pkg.version   || '1.0.0',
  AUTHOR:      pkg.author    || 'NeoKEX',

  // ── Account ──────────────────────────────────────────────────────────
  ACCOUNT_EMAIL:    process.env.ACCOUNT_EMAIL    || c.instagramAccount?.email    || '',
  ACCOUNT_PASSWORD: process.env.ACCOUNT_PASSWORD || c.instagramAccount?.password || '',
  ACCOUNT_2FA_SECRET: c.instagramAccount?.['2FASecret'] || '',
  ACCOUNT_I_USER:   c.instagramAccount?.i_user || '',
  ACCOUNT_PROXY:    c.instagramAccount?.proxy   || null,
  ACCOUNT_USER_AGENT: c.instagramAccount?.userAgent || '',
  INTERVAL_GET_NEW_COOKIE: c.instagramAccount?.intervalGetNewCookie ?? 1440,

  // ── General ───────────────────────────────────────────────────────────
  ANTI_INBOX:   c.antiInbox   ?? false,
  LANGUAGE:     c.language    || 'en',
  NICK_NAME_BOT: c.nickNameBot || 'Bot',
  PREFIX:       c.prefix || '!',
  NO_PREFIX:    c.noPrefix ?? true,

  // ── Admin-only mode ───────────────────────────────────────────────────
  ADMIN_ONLY_ENABLE:          c.adminOnly?.enable ?? false,
  ADMIN_ONLY_IGNORE_COMMANDS: c.adminOnly?.ignoreCommand || [],

  // ── Roles ─────────────────────────────────────────────────────────────
  // Role 0 = all users, 1 = unused/alias, 2 = adminBot, 3 = premiumUsers, 4 = devUsers
  ADMIN_BOT:     c.adminBot     || [],
  PREMIUM_USERS: c.premiumUsers || [],
  DEV_USERS:     c.devUsers     || [],

  // ── Whitelist (user-level) ────────────────────────────────────────────
  WHITELIST_ENABLE: c.whiteListMode?.enable ?? false,
  WHITELIST_IDS:    c.whiteListMode?.whiteListIds || [],

  // ── Whitelist (thread-level) ──────────────────────────────────────────
  WHITELIST_THREAD_ENABLE:    c.whiteListModeThread?.enable ?? false,
  WHITELIST_THREAD_IDS:       c.whiteListModeThread?.whiteListThreadIds || [],

  // ── Database ──────────────────────────────────────────────────────────
  DATABASE_TYPE:                 process.env.DATABASE_TYPE || c.database?.type || 'sqlite',
  MONGODB_URI:                   process.env.MONGODB_URI   || c.database?.uriMongodb || '',
  MONGODB_DATABASE:              process.env.MONGODB_DATABASE || c.database?.mongodbDatabase || 'instagram_bot',
  DB_AUTO_SYNC_WHEN_START:       c.database?.autoSyncWhenStart ?? false,
  DB_AUTO_REFRESH_THREAD_FIRST:  c.database?.autoRefreshThreadInfoFirstTime ?? true,
  DATABASE_PATH:                 process.env.DATABASE_PATH || './storage/data/bot.sqlite',
  DATABASE_AUTO_SAVE:            c.database?.autoSave ?? true,
  DATABASE_SAVE_INTERVAL:        (c.database?.saveIntervalMinutes ?? 1) * 60 * 1000,

  // ── Timezone ──────────────────────────────────────────────────────────
  TIMEZONE: process.env.TZ || c.timeZone || 'UTC',

  // ── Dashboard ─────────────────────────────────────────────────────────
  DASHBOARD_ENABLE:      c.dashBoard?.enable ?? false,
  DASHBOARD_EXPIRE_CODE: c.dashBoard?.expireVerifyCode ?? 300000,
  DASHBOARD_PORT:        c.dashBoard?.port ?? 5000,

  // ── Server uptime ─────────────────────────────────────────────────────
  SERVER_UPTIME_ENABLE: c.serverUptime?.enable ?? false,
  SERVER_UPTIME_PORT:   c.serverUptime?.port ?? 5000,
  SERVER_UPTIME_SOCKET: c.serverUptime?.socket || {},

  // ── Spam protection ───────────────────────────────────────────────────
  SPAM_COMMAND_THRESHOLD: c.spamProtection?.commandThreshold ?? 8,
  SPAM_TIME_WINDOW:       c.spamProtection?.timeWindow       ?? 10,
  SPAM_BAN_DURATION:      c.spamProtection?.banDuration      ?? 24,

  // ── Auto restart ──────────────────────────────────────────────────────
  AUTO_RESTART_TIME: c.autoRestart?.time || null,

  // ── Auto uptime ───────────────────────────────────────────────────────
  AUTO_UPTIME_ENABLE:   c.autoUptime?.enable ?? true,
  AUTO_UPTIME_INTERVAL: c.autoUptime?.timeInterval ?? 180,
  AUTO_UPTIME_URL:      c.autoUptime?.url || '',

  // ── Auto load scripts ─────────────────────────────────────────────────
  AUTO_LOAD_SCRIPTS_ENABLE:  c.autoLoadScripts?.enable ?? false,
  AUTO_LOAD_IGNORE_CMDS:     c.autoLoadScripts?.ignoreCmds || '',
  AUTO_LOAD_IGNORE_EVENTS:   c.autoLoadScripts?.ignoreEvents || '',

  // ── Misc toggles ──────────────────────────────────────────────────────
  AUTO_REFRESH_FBSTATE:           c.autoRefreshFbstate           ?? true,
  AUTO_RELOGIN_WHEN_CHANGE:       c.autoReloginWhenChangeAccount ?? false,
  AUTO_RESTART_WHEN_MQTT_ERROR:   c.autoRestartWhenListenMqttError ?? false,

  // ── Restart listen MQTT ───────────────────────────────────────────────
  RESTART_LISTEN_MQTT: {
    enable:                 c.restartListenMqtt?.enable ?? true,
    timeRestart:            c.restartListenMqtt?.timeRestart ?? 3600000,
    delayAfterStopListening: c.restartListenMqtt?.delayAfterStopListening ?? 2000,
    logNoti:                c.restartListenMqtt?.logNoti ?? true
  },

  // ── Notifications on MQTT error ───────────────────────────────────────
  NOTI_MQTT_ERROR: {
    telegram:    c.notiWhenListenMqttError?.telegram    || { enable: false, botToken: '', chatId: '' },
    discordHook: c.notiWhenListenMqttError?.discordHook || { enable: false, webhookUrl: '' }
  },

  // ── Hide notification messages ────────────────────────────────────────
  HIDE_NOTI: {
    commandNotFound:           c.hideNotiMessage?.commandNotFound           ?? false,
    adminOnly:                 c.hideNotiMessage?.adminOnly                 ?? false,
    threadBanned:              c.hideNotiMessage?.threadBanned              ?? false,
    userBanned:                c.hideNotiMessage?.userBanned                ?? false,
    needRoleToUseCmd:          c.hideNotiMessage?.needRoleToUseCmd          ?? false,
    needRoleToUseCmdOnReply:   c.hideNotiMessage?.needRoleToUseCmdOnReply   ?? false,
    needRoleToUseCmdOnReaction: c.hideNotiMessage?.needRoleToUseCmdOnReaction ?? false
  },

  // ── Log events ────────────────────────────────────────────────────────
  LOG_EVENTS: {
    disableAll:       c.logEvents?.disableAll      ?? false,
    message:          c.logEvents?.message         ?? true,
    message_reaction: c.logEvents?.message_reaction ?? true,
    message_unsend:   c.logEvents?.message_unsend  ?? true,
    message_reply:    c.logEvents?.message_reply   ?? true,
    event:            c.logEvents?.event           ?? true,
    read_receipt:     c.logEvents?.read_receipt    ?? false,
    typ:              c.logEvents?.typ             ?? false,
    presence:         c.logEvents?.presence        ?? false
  },

  // ── Typing indicator ──────────────────────────────────────────────────
  TYPING_INDICATOR:          c.typingIndicator?.enable   ?? true,
  TYPING_INDICATOR_DURATION: c.typingIndicator?.duration ?? 2000,

  // ── Options FCA (Instagram API options) ──────────────────────────────
  OPTIONS_FCA: (() => {
    const o = c.optionsFca || {};
    const clean = {};
    for (const [k, v] of Object.entries(o)) {
      if (k !== 'notes') clean[k] = v;
    }
    return clean;
  })(),

  // ── Paths ─────────────────────────────────────────────────────────────
  ACCOUNT_FILE:  process.env.ACCOUNT_FILE || './account.txt',
  COMMANDS_PATH: './commands',
  EVENTS_PATH:   './events',
  LOGS_PATH:     './storage/logs',
  DATA_PATH:     './storage/data',
  TEMP_PATH:     './temp',

  // ── Logging ───────────────────────────────────────────────────────────
  LOG_LEVEL:              process.env.LOG_LEVEL || 'debug',
  ENABLE_FILE_LOGGING:    true,
  ENABLE_CONSOLE_LOGGING: true,

  // ── Message queue ─────────────────────────────────────────────────────
  MESSAGE_DELAY_MS: c.messageDelayMs ?? 500,

  // ── Legacy / kept for compatibility ──────────────────────────────────
  AUTO_RECONNECT:         true,
  MAX_RECONNECT_ATTEMPTS: 5,
  SESSION_SECRET:         process.env.SESSION_SECRET || 'default_session_secret',

  // Raw config object (for ConfigManager dynamic reads)
  _raw: c
};
