#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js 22 or newer is required: https://nodejs.org/"
  exit 1
fi

node_major="$(node -p "Number(process.versions.node.split('.')[0])")"
if [ "$node_major" -lt 22 ]; then
  echo "Node.js 22 or newer is required. Installed: $(node --version)"
  exit 1
fi

echo "Installing the GameVault cloud tools…"
npm install

echo "Cloudflare will open a browser so you can sign in."
npx wrangler login

printf "Database name [gamevault]: "
read -r database_name
database_name="${database_name:-gamevault}"

echo "Creating your private D1 database…"
npx wrangler d1 create "$database_name" --binding DB --update-config -c workers/api/wrangler.jsonc

sync_token="$(node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")"
umask 077
printf "%s\n" "$sync_token" > .gamevault-sync-token
printf "%s\n" "$sync_token" | npx wrangler secret put SYNC_TOKEN -c workers/api/wrangler.jsonc

printf "Add IGDB artwork, search, release dates, and trailers now? [y/N]: "
read -r add_igdb
if [[ "$add_igdb" =~ ^[Yy]$ ]]; then
  echo "Wrangler will securely prompt for your Twitch/IGDB Client ID."
  npx wrangler secret put IGDB_CLIENT_ID -c workers/api/wrangler.jsonc
  echo "Now enter the Client Secret."
  npx wrangler secret put IGDB_CLIENT_SECRET -c workers/api/wrangler.jsonc
fi

printf "Add Steam library import now? [y/N]: "
read -r add_steam
if [[ "$add_steam" =~ ^[Yy]$ ]]; then
  echo "Wrangler will securely prompt for your Steam Web API key."
  npx wrangler secret put STEAM_API_KEY -c workers/api/wrangler.jsonc
fi

echo "Creating the GameVault tables…"
npx wrangler d1 migrations apply DB --remote -c workers/api/wrangler.jsonc

echo "Deploying your private API…"
npx wrangler deploy -c workers/api/wrangler.jsonc

echo
echo "Cloud setup finished."
echo "1. Copy the workers.dev URL printed above into GameVault Settings."
echo "2. Copy this personal sync token into GameVault Settings:"
echo
echo "$sync_token"
echo
echo "A private backup of the token is stored in cloud/.gamevault-sync-token."
echo "Never share it: anyone with the token can read and change this cloud library."
