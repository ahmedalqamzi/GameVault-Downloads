# GameVault downloads

Public downloads, screenshots, and install instructions for GameVault.

## Open the download page

<https://ahmedalqamzi.github.io/GameVault-Downloads/>

## Direct downloads

| Platform | File | SHA-256 |
| --- | --- | --- |
| Android 8+ | [GameVault-Android.apk](downloads/GameVault-Android.apk) | `230699d29d2da6faf014b8751ddf4ab130a3f4e2bc0c801e917c5def3161079c` |
| iOS 17+ | [GameVault-iOS-unsigned.ipa](downloads/GameVault-iOS-unsigned.ipa) | `fd09c641ee07fc401cd188b50648bfa65bf5b539e6f682bc84553bd222951227` |
| Optional cloud | [GameVault-Cloud-Setup.zip](downloads/GameVault-Cloud-Setup.zip) | `0086f09fdfcfe56acab768aa64aec6fe4fb271206e779157b84c32c7b5cca7b9` |

The Android APK is a signed direct-install build. The iPhone IPA is unsigned and must be installed with SideStore, AltStore, or another sideloading tool. Free Apple signing normally needs refreshing every seven days.

## Use it without a server

GameVault starts in phone-only mode. Install once and live search, covers, dates, scores, franchises, stores, and available trailers work automatically while online—no PC, account, or token setup. Personal library data stays on that device unless cloud sync is configured.

Signed APK updates retain the existing Android library when installed over the old version. Settings can also export and restore a complete local JSON backup without including the private sync token.

## Optional private cloud

Each person should deploy their own Cloudflare Worker and D1 database and keep their token private. Do not share another person's token: a token holder can read and change that cloud library.

See the [cloud setup guide](CLOUD_SETUP.md) and [privacy notes](PRIVACY.md).

## Privacy of this repository

This repository contains distribution files, a static website, sanitized demonstration screenshots, and a sanitized optional cloud setup kit. It contains no personal library export, notes, sync token, IGDB secret, signing secret, or private database identifier.
