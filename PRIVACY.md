# GameVault privacy

## Local by default

GameVault can keep the personal library entirely on the installed device. No account is required. Local folders, notes, ratings, tags, progress, play sessions, friend labels, and preferences are not sent to the metadata service. Local JSON backups also omit the private sync token.

Live catalog, discovery-feed, and metadata requests send only the search text, feed cursor, requested month, or IGDB game IDs needed for the request to the hosted Cloudflare Worker. A random installation identifier and ordinary network information are used for rate limiting; they are not a GameVault account and are not combined with library entries or personal notes.

## Steam connection

Steam sign-in happens on Steam Community through OpenID. GameVault receives the account's public 64-bit Steam ID and issues an account-scoped session, not the Steam username, password, Steam Guard code, cookie, sentry file, or browser session. The hosted service uses its operator API credential to request visibility-permitted owned games, playtime, public persona, friends, and achievement information from Steam for that verified ID. On a computer where Steam is already signed in, GameVault Desktop can also read only Steam's public local library and friend cache, then send an outbound HTTPS snapshot of owned app IDs, game names, playtime, last-played/installed state, friend IDs, display names, and public avatar hashes. It does not open an inbound PC port or read Steam login secrets. The relay retains the most recent snapshot so the phone can continue using its last imported copy when that PC is off.

Steam privacy settings determine which library, playtime, friend, achievement, and presence fields Steam makes available. Detailed achievement lists are cached on the device; if optional collection sync is connected, the smaller Steam activity and completion summaries sync with the library.

Compatibility enrichment sends Steam app IDs to the Steam Store metadata service and ProtonDB to retrieve popular tags, features, controller support, native Linux availability, and community Proton ratings. The Worker caches that app-level metadata in D1. It does not send or store personal notes, folders, ratings, or the rest of the local library with those requests. Proton ratings are community data and are shown as best-effort guidance rather than a guarantee.

## Optional Friend Wishlists

Friend Wishlist sharing is off by default. If the user enables it, the hosted GameVault service stores the verified Steam ID, public persona name and avatar, sharing preference, update timestamp, and a snapshot of up to 500 games currently marked Wishlist. It does not publish owned games, play progress, notes, ratings, custom folders, or the rest of the library.

When someone opens Friend Wishlists, GameVault asks Steam for that account's visibility-permitted friend IDs and returns snapshots only for matching friends who also enabled sharing. Turning sharing off removes the published game snapshot. Choosing **Remove sharing profile** deletes the social profile and snapshot; neither action deletes games from the user's on-device or personal cloud library.

## Optional cloud

The optional cloud kit deploys to the user's own Cloudflare account. It is protected by one personal bearer token and is intended for one owner. A token holder can read and change that cloud library, so the token must not be shared.

IGDB credentials stay in Cloudflare Worker secrets. They are never stored in an APK, IPA, browser bundle, screenshot, or this repository.

## This download page

The GitHub Pages download site uses no analytics, advertising, account system, or tracking script. GitHub may process ordinary web-server data under its own policies when it hosts the page and files.

The screenshots use a synthetic demonstration library. This repository contains no personal library export, private notes, sync token, IGDB secret, signing secret, or private database identifier.

## External services

- GitHub hosts this page and the public download files.
- Cloudflare hosts the web app, hosted metadata/Steam/social service, and any personal cloud a user chooses to deploy.
- The hosted Cloudflare Worker proxies IGDB game metadata and stores only the account-scoped Steam relay and explicitly published Friend Wishlist data described above; a separately configured personal Worker can provide private library sync.
- Steam Community handles optional Steam sign-in. Steam's Web API supplies visibility-permitted library, playtime, friend, persona, achievement, and presence data. A signed-in GameVault desktop can send the public local library/friend snapshot described above as an optional fallback.
- The Steam Store provides tags, features, controller support, and native Linux availability from Steam app IDs; ProtonDB provides community Linux compatibility summaries.
- YouTube hosts linked trailers.
- Apple/SideStore/AltStore or Android handles installation on the device.

GameVault is not affiliated with the game publishers, Steam, Valve, ProtonDB, IGDB, Twitch, YouTube, Apple, Google, Cloudflare, SideStore, or AltStore.
