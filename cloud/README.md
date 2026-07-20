# GameVault personal cloud setup kit

This kit deploys a private GameVault sync API to your own Cloudflare account. The app already has read-only metadata; use this kit only for off-device backup, autosync, multiple devices, or your own IGDB proxy.

## Before you start

You need:

- A computer with [Node.js 22 or newer](https://nodejs.org/)
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up)
- About 10 minutes
- Optional: Twitch/IGDB credentials for live search, covers, dates, scores, and trailers
- Optional: a Steam Web API key for owned-library and playtime import

No personal token or database ID is included in this kit.

## Guided setup

### macOS or Linux

Open Terminal in this `cloud` folder, then run:

```bash
chmod +x setup-cloud.sh
./setup-cloud.sh
```

### Windows

Open PowerShell in this `cloud` folder, then run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
./setup-cloud.ps1
```

The helper installs Wrangler, opens Cloudflare login, creates a D1 database, generates a random 64-character sync token, applies all migrations, and deploys the Worker. It never uploads the token to GitHub.

The optional Steam prompt stores the key as a Worker secret. Steam OpenID handles account sign-in on Steam's page, but Valve still requires this server-side key to read a visibility-permitted owned library. Steam popular tags, features, full/partial controller support, native Linux availability, and ProtonDB compatibility do not need the key; the Worker retrieves and caches that app-level metadata in D1.

At the end, copy the printed `workers.dev` URL and token into **GameVault → Settings → Optional Cloud**, then choose **Save connection** and **Sync**.

## Add IGDB later

IGDB uses Twitch application credentials. Create an application using the [IGDB authentication guide](https://api-docs.igdb.com/#account-creation), then run these commands from this folder:

```bash
npx wrangler secret put IGDB_CLIENT_ID -c workers/api/wrangler.jsonc
npx wrangler secret put IGDB_CLIENT_SECRET -c workers/api/wrangler.jsonc
npx wrangler deploy -c workers/api/wrangler.jsonc
```

Wrangler prompts for each value securely. Do not paste credentials into `wrangler.jsonc`.

## Add Steam later

Create a key at the [Steam Community API key page](https://steamcommunity.com/dev/apikey), then run:

```bash
npx wrangler secret put STEAM_API_KEY -c workers/api/wrangler.jsonc
npx wrangler deploy -c workers/api/wrangler.jsonc
```

## Important security boundary

This is a single-owner service. Anyone with the sync token can read and change the complete cloud library. Each friend should deploy their own kit and keep their own token private.

The generated token is stored locally in `.gamevault-sync-token`, which is excluded from Git. Keep a private backup. If it is exposed, replace the `SYNC_TOKEN` secret and update every device.

## What the cloud contains

- A Cloudflare Worker API
- A private D1 database
- Revision-based autosync between your devices
- Optional rate-limited IGDB metadata proxy and refresh every six hours
- JSON export endpoint for backups

GameVault remains usable from its local cache when the cloud is temporarily unavailable.
