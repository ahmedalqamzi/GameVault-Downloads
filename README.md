# GameVault 0.7.0 downloads

Public downloads, screenshots, and install instructions for GameVault.

## Open the download page

<https://ahmedalqamzi.github.io/GameVault-Downloads/>

## Direct downloads

| Platform | File | SHA-256 |
| --- | --- | --- |
| Android 8+ | [GameVault-Android.apk](downloads/GameVault-Android.apk) | `881dd47296d8e08ff465844f1137806541eaa7e8b78a15d042e8efb8c16a4c26` |
| iOS 17+ | [GameVault-iOS-unsigned.ipa](downloads/GameVault-iOS-unsigned.ipa) | `6c33e91efeddabaf636214684ab2443990a3662256bd2cc2933e52fd0cbf88d4` |
| Windows setup | [GameVault-0.7.0-windows-x64-setup.exe](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.7.0/GameVault-0.7.0-windows-x64-setup.exe) | `1e02c55ff752eaab2fc4310e2c6106fc3bdda3ee6cd9ecf6939ee98153aa10a4` |
| Windows portable | [GameVault-0.7.0-windows-x64-portable.exe](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.7.0/GameVault-0.7.0-windows-x64-portable.exe) | `8b819a094303f1fb1db61313c84654bbc8856e3e640251f608fa9dd7cd00c2da` |
| Linux x86-64 | [GameVault-0.7.0-linux-x86_64.AppImage](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.7.0/GameVault-0.7.0-linux-x86_64.AppImage) | `49f63e5632891c4c996bfbf696dfa2aebf85baf8e638da4ccbcfbd8f2dc06286` |
| macOS Apple Silicon DMG | [GameVault-0.7.0-mac-arm64.dmg](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.7.0/GameVault-0.7.0-mac-arm64.dmg) | `77140815b56646e4940e35aac2f1adb09fdf569aea4bb2c32ad4fea840fbb0bd` |
| macOS Apple Silicon ZIP | [GameVault-0.7.0-mac-arm64.zip](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.7.0/GameVault-0.7.0-mac-arm64.zip) | `9b722e99fae05fd4a3377889f1a2d306c7b1cab72a373498e2a0c72672652ab9` |
| Optional cloud | [GameVault-Cloud-Setup.zip](downloads/GameVault-Cloud-Setup.zip) | `0132de4248c9110b68cd903c87c75e2f835236f4bf49d16e5cd041aa6c638522` |

The Android APK is a signed direct-install build. The iPhone IPA is unsigned and must be installed with SideStore, AltStore, or another sideloading tool. Free Apple signing normally needs refreshing every seven days.

## Use it without a server

GameVault starts in local-only mode. Version 0.7.0 adds an account-scoped, outbound Steam desktop relay for the owned library, recent/lifetime playtime, friends, last-played dates, achievement completion, unlock dates, descriptions, and global rarity. GameVault never receives a Steam password or reads Steam login secrets, and phones retain the last successful snapshot when the PC or service is offline. Manual story and overall progress remain separate.

Searchable, multi-select checkbox filters work in both Collection and Catalog and cover every IGDB genre, theme, game-mode, and keyword value returned for those games, including Action, Horror, Co-op, and Multiplayer. The same Filter menu includes age rating, real Steam full/partial controller support, popular tags, and native Linux or ProtonDB compatibility.

Controller support, Steam tags, and ProtonDB results are loaded from their live metadata services and cached in the database; they are not placeholder labels. A normal saved game or Catalog result with a Steam store link is enough for compatibility enrichment. The Collection home remains tile-based for Playing, Backlog, Wishlist, Completed, Dropped, custom folders, and Franchises. Wishlist is the same as Want to Play and stays outside the owned-only My Library view.

Version 0.7.0 also adds private/manual friend profiles, cached Steam presence changes, IGDB time-to-beat estimates, multi-store ownership and hours, and an optional ordered Up Next 3. Steam sign-in opens Steam's own page and never gives GameVault the password. A Steam Web API key is optional rather than required; public Game Details visibility is needed only for public achievement/presence reads or that fallback.

Signed APK updates retain the existing Android library when installed over the old version, and 0.7.0 can check a signed-hash manifest for later APKs. The Windows setup build and Linux AppImage check the desktop update feed; Windows portable and unsigned macOS packages update manually. Settings can also export and restore a complete local JSON backup without including the private sync token.

## Optional private cloud

Each person should deploy their own Cloudflare Worker and D1 database and keep their token private. Do not share another person's token: a token holder can read and change that cloud library.

See the [cloud setup guide](CLOUD_SETUP.md) and [privacy notes](PRIVACY.md).
The complete release manifest is in [downloads/SHA256SUMS.txt](downloads/SHA256SUMS.txt).

## Privacy of this repository

This repository contains distribution files, a static website, sanitized demonstration screenshots, and a sanitized optional cloud setup kit. It contains no personal library export, notes, sync token, IGDB secret, signing secret, or private database identifier.
