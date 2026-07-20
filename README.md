# GameVault downloads

Public downloads, screenshots, and install instructions for GameVault.

## Open the download page

<https://ahmedalqamzi.github.io/GameVault-Downloads/>

## Direct downloads

| Platform | File | SHA-256 |
| --- | --- | --- |
| Android 8+ | [GameVault-Android.apk](downloads/GameVault-Android.apk) | `1f3760256defbd1f6fdf796f685407b78295a44dc7d533c84da1fb992be42d1e` |
| iOS 17+ | [GameVault-iOS-unsigned.ipa](downloads/GameVault-iOS-unsigned.ipa) | `c70d8f28b0dcb3aa5fb4b6a6e74a5b7d8e74f50bc0124ec4c46f48f2922a0894` |
| Optional cloud | [GameVault-Cloud-Setup.zip](downloads/GameVault-Cloud-Setup.zip) | `0086f09fdfcfe56acab768aa64aec6fe4fb271206e779157b84c32c7b5cca7b9` |

The Android APK is a signed direct-install build. The iPhone IPA is unsigned and must be installed with SideStore, AltStore, or another sideloading tool. Free Apple signing normally needs refreshing every seven days.

## Use it without a server

GameVault starts in phone-only mode. Install once and live search, covers, dates, scores, franchises, stores, trailers, and public-profile Steam import work automatically while online—no PC, account, personal server, or token setup. Personal library and Steam playtime stay on that device unless cloud sync is configured.

Signed APK updates retain the existing Android library when installed over the old version. Settings can also export and restore a complete local JSON backup without including the private sync token.

## Optional private cloud

Each person should deploy their own Cloudflare Worker and D1 database and keep their token private. Do not share another person's token: a token holder can read and change that cloud library.

See the [cloud setup guide](CLOUD_SETUP.md) and [privacy notes](PRIVACY.md).

## Privacy of this repository

This repository contains distribution files, a static website, sanitized demonstration screenshots, and a sanitized optional cloud setup kit. It contains no personal library export, notes, sync token, IGDB secret, signing secret, or private database identifier.
