# GameVault 0.4.0 downloads

Public downloads, screenshots, and install instructions for GameVault.

## Open the download page

<https://ahmedalqamzi.github.io/GameVault-Downloads/>

## Direct downloads

| Platform | File | SHA-256 |
| --- | --- | --- |
| Android 8+ | [GameVault-Android.apk](downloads/GameVault-Android.apk) | `9a2296f88d8315089fb901a0f964f454f0adf8fd96b773bc63770b96cdacff12` |
| iOS 17+ | [GameVault-iOS-unsigned.ipa](downloads/GameVault-iOS-unsigned.ipa) | `1ed85235ff5849e2cf69c17a7da1a586759bf0aacc78e54c2efb15d133ebb054` |
| Optional cloud | [GameVault-Cloud-Setup.zip](downloads/GameVault-Cloud-Setup.zip) | `17e6a161b3129420dc90f838a6e3bef6a2774d4b05837414abb3eb1e3364af76` |

The Android APK is a signed direct-install build. The iPhone IPA is unsigned and must be installed with SideStore, AltStore, or another sideloading tool. Free Apple signing normally needs refreshing every seven days.

## Use it without a server

GameVault starts in phone-only mode. Version 0.4.0 adds a tile-based Collection home for Playing, Backlog, Wishlist, Completed, Dropped, custom folders, and Franchises. One Filter menu now contains genres and play styles such as Action, Horror, Co-op, and Multiplayer, plus age rating, controller support, and Linux/Proton compatibility.

Steam sign-in opens Steam's own page, returns only the Steam ID, and never gives GameVault the password. Owned-library and playtime import requires a Steam Web API key on the metadata service and a Steam profile whose Game Details are visible. The optional cloud setup kit can configure that key securely.

Signed APK updates retain the existing Android library when installed over the old version. Settings can also export and restore a complete local JSON backup without including the private sync token.

## Optional private cloud

Each person should deploy their own Cloudflare Worker and D1 database and keep their token private. Do not share another person's token: a token holder can read and change that cloud library.

See the [cloud setup guide](CLOUD_SETUP.md) and [privacy notes](PRIVACY.md).

## Privacy of this repository

This repository contains distribution files, a static website, sanitized demonstration screenshots, and a sanitized optional cloud setup kit. It contains no personal library export, notes, sync token, IGDB secret, signing secret, or private database identifier.
