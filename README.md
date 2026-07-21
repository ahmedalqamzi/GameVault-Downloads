# GameVault 0.7.1 downloads

Public downloads, screenshots, and install instructions for GameVault.

## Open the download page

<https://ahmedalqamzi.github.io/GameVault-Downloads/>

## Direct downloads

| Platform | File | SHA-256 |
| --- | --- | --- |
| Android 8+ | [GameVault-Android.apk](downloads/GameVault-Android.apk) | `8c10d5ff0edd5ae8fd542ea83eef7fafe988dc01bdb0ea63e8653730c37860a6` |
| iOS 17+ | [GameVault-iOS-unsigned.ipa](downloads/GameVault-iOS-unsigned.ipa) | `6d20c48e85df0f0c7f3250ed724c4e80e09fd8e5e11064d5e47e6698c9aaf965` |
| Windows setup | [GameVault-0.7.1-windows-x64-setup.exe](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.7.1/GameVault-0.7.1-windows-x64-setup.exe) | `8ba6d96c35d8015d16fc9412e37363c4a7f5f783566756be10fa4c0cf143f523` |
| Windows portable | [GameVault-0.7.1-windows-x64-portable.exe](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.7.1/GameVault-0.7.1-windows-x64-portable.exe) | `9a5eeebf61ea8df4d0f759ab423cc9da0c15a23314954991349c9d5435a470a3` |
| Linux x86-64 | [GameVault-0.7.1-linux-x86_64.AppImage](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.7.1/GameVault-0.7.1-linux-x86_64.AppImage) | `c2ed54c87d5b21f48dc92dbbf4ef733f2945645bd538dd5ce54007424c4060bd` |
| macOS Apple Silicon DMG | [GameVault-0.7.1-mac-arm64.dmg](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.7.1/GameVault-0.7.1-mac-arm64.dmg) | `232dd6a69e9eb7751d041141af4e90a75e29ba1b0189441524a6a1074d491941` |
| macOS Apple Silicon ZIP | [GameVault-0.7.1-mac-arm64.zip](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.7.1/GameVault-0.7.1-mac-arm64.zip) | `801c1141570a6c33567a7bf97e54fcee6c21ea8811101f4ef948c8989cc1c824` |
| Optional cloud | [GameVault-Cloud-Setup.zip](downloads/GameVault-Cloud-Setup.zip) | `0132de4248c9110b68cd903c87c75e2f835236f4bf49d16e5cd041aa6c638522` |

The Android APK is a signed direct-install build. The iPhone IPA is unsigned and must be installed with SideStore, AltStore, or another sideloading tool. Free Apple signing normally needs refreshing every seven days.

## Use it without a server

GameVault starts in local-only mode. Version 0.7.1 adds 24 selectable themes and standalone Steam server access alongside the account-scoped desktop relay for owned games, playtime, friends, last-played dates, achievements, unlock dates, descriptions, and global rarity. GameVault never receives a Steam password or reads Steam login secrets, and phones retain the last successful data when the PC or service is offline. Manual story and overall progress remain separate.

Searchable, multi-select checkbox filters work in both Collection and Catalog and cover every IGDB genre, theme, game-mode, and keyword value returned for those games, including Action, Horror, Co-op, and Multiplayer. The same Filter menu includes age rating, real Steam full/partial controller support, popular tags, and native Linux or ProtonDB compatibility.

Controller support, Steam tags, and ProtonDB results are loaded from their live metadata services and cached in the database; they are not placeholder labels. A normal saved game or Catalog result with a Steam store link is enough for compatibility enrichment. The Collection home remains tile-based for Playing, Backlog, Wishlist, Completed, Dropped, custom folders, and Franchises. Wishlist is the same as Want to Play and stays outside the owned-only My Library view.

Version 0.7.1 also includes private/manual friend profiles, cached Steam presence changes, IGDB time-to-beat estimates, multi-store ownership and hours, and an optional ordered Up Next 3. Steam sign-in opens Steam's own page and never gives GameVault the password. Public Profile and Game Details visibility is required when Steam supplies library, achievement, or presence data through its Web API.

Signed APK updates retain the existing Android library when installed over the old version, and 0.7.1 checks a signed-hash manifest for later APKs. The Windows setup build and Linux AppImage check the desktop update feed; Windows portable and unsigned macOS packages update manually. Settings can also export and restore a complete local JSON backup without including the private sync token.

## Optional private cloud

Each person should deploy their own Cloudflare Worker and D1 database and keep their token private. Do not share another person's token: a token holder can read and change that cloud library.

See the [cloud setup guide](CLOUD_SETUP.md) and [privacy notes](PRIVACY.md).
The complete release manifest is in [downloads/SHA256SUMS.txt](downloads/SHA256SUMS.txt).

## Privacy of this repository

This repository contains distribution files, a static website, sanitized demonstration screenshots, and a sanitized optional cloud setup kit. It contains no personal library export, notes, sync token, IGDB secret, signing secret, or private database identifier.
