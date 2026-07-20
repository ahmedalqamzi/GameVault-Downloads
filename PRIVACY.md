# GameVault privacy

## Local by default

GameVault can keep the personal library entirely on the installed device. No account is required. Local folders, notes, ratings, tags, progress, play sessions, friend labels, and preferences are not sent to the metadata service. Local JSON backups also omit the private sync token.

Live catalog and metadata requests send only the search text or IGDB game IDs needed for the request to the hosted Cloudflare Worker. A random installation identifier and ordinary network information are used for rate limiting; they are not a GameVault account and are not combined with library entries or personal notes.

## Steam connection

Steam sign-in happens on Steam Community through OpenID. GameVault receives the account's public 64-bit Steam ID, not the Steam username or password. If the user starts an import, the Worker uses that ID and its server-side Steam Web API key to request games and playtime that the account's Game Details privacy setting allows.

Compatibility enrichment sends Steam app IDs to the Steam Store metadata service and ProtonDB to retrieve popular tags, features, controller support, native Linux availability, and community Proton ratings. The Worker caches that app-level metadata in D1. It does not send or store personal notes, folders, ratings, or the rest of the local library with those requests. Proton ratings are community data and are shown as best-effort guidance rather than a guarantee.

## Optional cloud

The optional cloud kit deploys to the user's own Cloudflare account. It is protected by one personal bearer token and is intended for one owner. A token holder can read and change that cloud library, so the token must not be shared.

IGDB credentials stay in Cloudflare Worker secrets. They are never stored in an APK, IPA, browser bundle, screenshot, or this repository.

## This download page

The GitHub Pages download site uses no analytics, advertising, account system, or tracking script. GitHub may process ordinary web-server data under its own policies when it hosts the page and files.

The screenshots use a synthetic demonstration library. This repository contains no personal library export, private notes, sync token, IGDB secret, signing secret, or private database identifier.

## External services

- GitHub hosts this page and the public download files.
- Cloudflare hosts the optional web app and any personal cloud a user chooses to deploy.
- The hosted Cloudflare Worker proxies read-only IGDB game metadata; a separately configured personal Worker can provide private library sync.
- Steam Community handles optional Steam sign-in, and the Steam Web API returns visibility-permitted library and playtime data when configured.
- The Steam Store provides tags, features, controller support, and native Linux availability from Steam app IDs; ProtonDB provides community Linux compatibility summaries.
- YouTube hosts linked trailers.
- Apple/SideStore/AltStore or Android handles installation on the device.

GameVault is not affiliated with the game publishers, Steam, Valve, ProtonDB, IGDB, Twitch, YouTube, Apple, Google, Cloudflare, SideStore, or AltStore.
