# GameVault 0.6.0 downloads

Public downloads, screenshots, and install instructions for GameVault.

## Open the download page

<https://ahmedalqamzi.github.io/GameVault-Downloads/>

## Direct downloads

| Platform | File | SHA-256 |
| --- | --- | --- |
| Android 8+ | [GameVault-Android.apk](downloads/GameVault-Android.apk) | `9e68989d552f59476634bb9ad2b4010b328b9f7073c4d958bc58b93dc685fc79` |
| iOS 17+ | [GameVault-iOS-unsigned.ipa](downloads/GameVault-iOS-unsigned.ipa) | `b89e0564ac58be194979b0a96ff56c0227c4822f94e3f4a32ce38d973bb5d75c` |
| Optional cloud | [GameVault-Cloud-Setup.zip](downloads/GameVault-Cloud-Setup.zip) | `c61525976e99a27a31a8e36c69b63fde3fa0a2db0fd97cd445a58115acfd0add` |

The Android APK is a signed direct-install build. The iPhone IPA is unsigned and must be installed with SideStore, AltStore, or another sideloading tool. Free Apple signing normally needs refreshing every seven days.

## Use it without a server

GameVault starts in phone-only mode. Version 0.6.0 imports a Steam library after the user signs in on Steam's page and tracks recent/lifetime playtime, Windows/macOS/Linux/Steam Deck activity, last-played dates, achievement completion, unlock dates, descriptions, and global rarity. Manual story and overall progress remain separate.

Searchable, multi-select tick-box filters cover every IGDB genre, theme, game-mode, and keyword value attached to your games. The current synced collection exposes 2,597 distinct genre/style values, including Action, Horror, Co-op, and Multiplayer. The same Filter menu includes age rating, Steam full/partial controller support, Steam popular tags, and native Linux or ProtonDB compatibility.

Controller support, Steam tags, and ProtonDB results are loaded from their live metadata services and cached in the database; they are not placeholder labels. A normal saved game's Steam store link is enough for compatibility enrichment. The Collection home remains tile-based for Playing, Backlog, Wishlist, Completed, Dropped, custom folders, and Franchises.

Steam sign-in opens Steam's own page, returns only the Steam ID, and never gives GameVault the password. The service operator configures one server-side Steam Web API key; phone users do not need their own key. Import requires a Steam profile whose Game Details are visible. The optional cloud setup kit can configure the server key securely.

Signed APK updates retain the existing Android library when installed over the old version. Settings can also export and restore a complete local JSON backup without including the private sync token.

## Optional private cloud

Each person should deploy their own Cloudflare Worker and D1 database and keep their token private. Do not share another person's token: a token holder can read and change that cloud library.

See the [cloud setup guide](CLOUD_SETUP.md) and [privacy notes](PRIVACY.md).

## Privacy of this repository

This repository contains distribution files, a static website, sanitized demonstration screenshots, and a sanitized optional cloud setup kit. It contains no personal library export, notes, sync token, IGDB secret, signing secret, or private database identifier.
