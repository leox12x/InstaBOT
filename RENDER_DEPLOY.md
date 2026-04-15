# InstaBOT on Render Free Tier — Complete Deployment Guide

## What this covers

Deploying InstaBOT (Instagram bot) to Render.com's free tier so it stays alive
24/7 without a credit card. Every known blocker is addressed.

---

## The Core Problem

Render Free has one rule that breaks almost every Node.js bot:

> **The filesystem is ephemeral.** Every redeploy, restart, or spin-down
> wipes all local files — including `account.txt` and `bot.sqlite`.

InstaBOT has both:
- Credentials stored in `account.txt` (Instagram cookies)
- SQLite database at `./storage/data/bot.sqlite`

Both are lost on every deploy. The fix is a two-step migration.

---

## Step 1 — Fix the credential problem

### Option A: Environment variables (recommended)

Edit `config/default.json`:

```json
"instagramAccount": {
  "email":    "",
  "password": "",
  ...
}
```

Leave the JSON fields empty. Set real values via environment variables in
the Render dashboard:

```
ACCOUNT_EMAIL=your@email.com
ACCOUNT_PASSWORD=yourpassword
```

The config loader already reads from `process.env` first, so these take
priority over the JSON values.

### Option B: Encrypted cookie jar on a persistent Redis instance

If Instagram requires the actual cookie format (not email/password login),
Render Free lets you create **one free Key Value (Redis) instance** for
state persistence.

Create a small helper script to store/retrieve the cookie:

```js
// scripts/redisCookieStore.js
const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL
});

async function saveCookie(cookieString) {
  await client.connect();
  await client.set('insta_cookie', cookieString);
  await client.quit();
}

async function loadCookie() {
  await client.connect();
  const cookie = await client.get('insta_cookie');
  await client.quit();
  return cookie;
}

module.exports = { saveCookie, loadCookie };
```

Then in `config/default.json`, set `ACCOUNT_FILE` to empty and patch
`InstagramBot.js` to call `loadCookie()` instead of reading from file.

**Limitation**: Free Redis instances lose data on restart. For a bot that
runs 24/7 this is usually acceptable — the cookie refresh feature will
re-login automatically.

---

## Step 2 — Fix the database problem

### Option A: MongoDB Atlas (recommended, free forever)

1. Create a free cluster at [mongodb.com](https://www.mongodb.com/atlas)
2. Create a database user and whitelist `0.0.0.0/0`
3. Copy your connection URI

In `config/default.json`:

```json
"database": {
  "type": "sqlite",
  "uriMongodb": "",
  ...
}
```

Set the environment variable in Render:

```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/instagram_bot
```

The database loader checks `MONGODB_URI` first and switches to MongoDB
automatically. No code changes needed.

### Option B: Render Free Postgres (expires in 30 days)

```json
"database": {
  "type": "mongodb",
  "uriMongodb": "postgres://your-render-postgres-url"
}
```

**Warning**: Free Postgres expires after 30 days. Set a calendar reminder
to upgrade before expiration, or migrate to MongoDB Atlas from the start.

---

## Step 3 — Create the Render project

### 1. Push your code to GitHub

```bash
cd ~/InstaBOT
git init
git add .
git commit -m "Initial commit"
gh repo create InstaBOT --public --push
```

### 2. Create a Render Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Region** | Singapore (closest to BD) |
| **Branch** | main |
| **Root directory** | (leave blank) |
| **Runtime** | Node |
| **Build command** | `npm install` |
| **Start command** | `npm start` |
| **Instance type** | Free |

### 3. Add environment variables

In the Render dashboard → **Environment** tab:

```
NODE_ENV=production
ACCOUNT_EMAIL=your@email.com
ACCOUNT_PASSWORD=yourpassword
MONGODB_URI=mongodb+srv://...
PORT=3000
TZ=Asia/Dhaka
LOG_LEVEL=info
```

### 4. Health check endpoint

InstaBOT already has a built-in health server. Make sure the health
endpoint is at `/` or `/health`:

```js
// In InstagramBot.js — update startHealthServer()
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  res.writeHead(404);
  res.end();
});
```

### 5. Uptime monitoring (prevent spin-down)

Render Free spins down after 15 minutes of no traffic. Add a free uptime
monitor:

**Cron-job.org** (free, supports HTTP GET):

1. Create account at [cron-job.org](https://cron-job.org)
2. Create a job: `GET https://your-service.onrender.com/health`
3. Set schedule: every 5 minutes
4. Copy the callback URL as a cron-job

Or use **UptimeRobot** (free tier: 50 monitors):

1. Create account at [uptimerobot.com](https://uptimerobot.com)
2. Add monitor → HTTP(s) → enter your Render URL
3. Check every 5 minutes

This keeps the bot awake 24/7 without a credit card.

---

## Step 4 — Update package.json

Add a `postinstall` script to ensure everything builds correctly:

```json
"scripts": {
  "start": "node index.js",
  "postinstall": "npm rebuild sql.js"
}
```

Also add `engines` to prevent Node version mismatches:

```json
"engines": {
  "node": ">=18.0.0"
}
```

---

## Step 5 — GitHub Actions (optional auto-deploy)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - name: Trigger Render Deploy
        env:
          RENDER_DEPLOY_HOOK_URL: ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
        run: curl -s "$RENDER_DEPLOY_HOOK_URL"
```

In Render dashboard → your service → **Deploys** → **Automate
Deploys** → copy the webhook URL → add it to GitHub repo secrets as
`RENDER_DEPLOY_HOOK_URL`.

---

## Known limitations on Render Free

| Issue | Impact | Fix |
|-------|--------|-----|
| Spins down after 15 min idle | First request takes ~1 min to wake | Uptime monitor ping every 5 min |
| Ephemeral filesystem | `account.txt` + SQLite lost on redeploy | Env vars + MongoDB Atlas |
| Free Postgres expires in 30 days | Database gone after 30 days | Use MongoDB Atlas instead |
| No outbound SMTP (ports 25/465/587) | Email notifications blocked | Use Telegram/Discord webhooks |
| No SSH access | Can't debug interactively | Use Render logs dashboard |
| 750 free instance hours/month | Auto-suspend if exceeded | Upgrade to Starter $7/mo if needed |
| Max 1 free Postgres | Only one DB allowed | MongoDB Atlas (no limit) |

---

## Quick checklist

- [ ] Set `ACCOUNT_EMAIL` and `ACCOUNT_PASSWORD` in Render env vars
- [ ] Set `MONGODB_URI` in Render env vars (MongoDB Atlas)
- [ ] Set `PORT=3000` in Render env vars
- [ ] Set `TZ=Asia/Dhaka` in Render env vars
- [ ] Create uptime monitor (cron-job.org or UptimeRobot) every 5 min
- [ ] Update `package.json` with `engines` field
- [ ] Push to GitHub and connect to Render
- [ ] Set instance type to **Free**
- [ ] Verify health endpoint: `https://your-service.onrender.com/health`
- [ ] Test by sending a DM to the Instagram account

---

## One command deploy (alternative)

If you prefer not to use GitHub, use Render CLI:

```bash
npm install -g render-cli
render login
render deploy --plan free \
  --name InstaBOT \
  --env node \
  --build-command "npm install" \
  --start-command "npm start"
```

Then set env vars via:
```bash
render env set ACCOUNT_EMAIL=your@email.com
render env set MONGODB_URI=mongodb+srv://...
```