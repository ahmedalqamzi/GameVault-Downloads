# GameVault 0.5.0 downloads

Public downloads, screenshots, and install instructions for GameVault.

## Open the download page

<https://ahmedalqamzi.github.io/GameVault-Downloads/>

## Direct downloads

| Platform | File | SHA-256 |
| --- | --- | --- |
| Android 8+ | [GameVault-Android.apk](downloads/GameVault-Android.apk) | `aaa0d8ede7a50b9a5917486763549431012a3c561e72bfcd15f6de244a7a144c` |
| iOS 17+ | [GameVault-iOS-unsigned.ipa](downloads/GameVault-iOS-unsigned.ipa) | `e24b37f4c664795be536d4d3674052cd91bd5dab421a29621d76153e1bbd126c` |
| Optional cloud | [GameVault-Cloud-Setup.zip](downloads/GameVault-Cloud-Setup.zip) | `2ef4d69f2ee9908982d2f497da84ece8b3fa2bd1122696d19b421722e5090f55` |

The Android APK is a signed direct-install build. The iPhone IPA is unsigned and must be installed with SideStore, AltStore, or another sideloading tool. Free Apple signing normally needs refreshing every seven days.

## Use it without a server

GameVault starts in phone-only mode. Version 0.5.0 adds searchable, multi-select tick-box filters for every IGDB genre, theme, game-mode, and keyword value attached to your games. The current synced collection exposes 2,597 distinct genre/style values, including Action, Horror, Co-op, and Multiplayer. The same Filter menu includes age rating, Steam full/partial controller support, Steam popular tags, and native Linux or ProtonDB compatibility.

Controller support, Steam tags, and ProtonDB results are loaded from their live metadata services and cached in the database; they are not placeholder labels. A normal saved game's Steam store link is enough for compatibility enrichment. The Collection home remains tile-based for Playing, Backlog, Wishlist, Completed, Dropped, custom folders, and Franchises.

Steam sign-in opens Steam's own page, returns only the Steam ID, and never gives GameVault the password. Owned-library and playtime import requires a Steam Web API key on the metadata service and a Steam profile whose Game Details are visible. The optional cloud setup kit can configure that key securely.

Signed APK updates retain the existing Android library when installed over the old version. Settings can also export and restore a complete local JSON backup without including the private sync token.

## Optional private cloud

Each person should deploy their own Cloudflare Worker and D1 database and keep their token private. Do not share another person's token: a token holder can read and change that cloud library.

See the [cloud setup guide](CLOUD_SETUP.md) and [privacy notes](PRIVACY.md).

## Privacy of this repository

This repository contains distribution files, a static website, sanitized demonstration screenshots, and a sanitized optional cloud setup kit. It contains no personal library export, notes, sync token, IGDB secret, signing secret, or private database identifier.
