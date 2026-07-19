# GameVault privacy

## Local by default

GameVault can keep the library entirely on the installed device. No account is required. Local entries, notes, ratings, tags, play sessions, friend labels, and preferences are not sent anywhere unless the owner configures cloud sync.

## Optional cloud

The optional cloud kit deploys to the user's own Cloudflare account. It is protected by one personal bearer token and is intended for one owner. A token holder can read and change that cloud library, so the token must not be shared.

IGDB credentials stay in Cloudflare Worker secrets. They are never stored in an APK, IPA, browser bundle, screenshot, or this repository.

## This download page

The GitHub Pages download site uses no analytics, advertising, account system, or tracking script. GitHub may process ordinary web-server data under its own policies when it hosts the page and files.

The screenshots use a synthetic demonstration library. This repository contains no personal library export, private notes, sync token, IGDB secret, signing secret, or private database identifier.

## External services

- GitHub hosts this page and the public download files.
- Cloudflare hosts the optional web app and any personal cloud a user chooses to deploy.
- IGDB provides optional game metadata through the user's Worker credentials.
- YouTube hosts linked trailers.
- Apple/SideStore/AltStore or Android handles installation on the device.

GameVault is not affiliated with the game publishers, IGDB, Twitch, YouTube, Apple, Google, Cloudflare, SideStore, or AltStore.
