# GameVault 0.8.0 downloads

Public downloads, screenshots, and install instructions for GameVault.

## Open the download page

<https://ahmedalqamzi.github.io/GameVault-Downloads/>

## Direct downloads

| Platform | File | SHA-256 |
| --- | --- | --- |
| Android 8+ | [GameVault-Android.apk](downloads/GameVault-Android.apk) | `30064c5b1a9dbad5ddfadb6a04a867779ef81cc7c7a33992de377f0da508a050` |
| iOS 17+ | [GameVault-iOS-unsigned.ipa](downloads/GameVault-iOS-unsigned.ipa) | `f20e54119ee413b8754cce8109c8ca7528a01326ffaf192582722c1e2f39e675` |
| Windows setup | [GameVault-0.8.0-windows-x64-setup.exe](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.8.0/GameVault-0.8.0-windows-x64-setup.exe) | `473ed75737ddf30d88c28ae4f71766194190e9c62e93878cbbc0896ef1635769` |
| Windows portable | [GameVault-0.8.0-windows-x64-portable.exe](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.8.0/GameVault-0.8.0-windows-x64-portable.exe) | `a41f7f09242a2bd2a0c0099c7661c025829df2c4d5b6e7041d23e5879a0a4e6d` |
| Linux x86-64 | [GameVault-0.8.0-linux-x86_64.AppImage](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.8.0/GameVault-0.8.0-linux-x86_64.AppImage) | `cbd037dabc881bf1ef1ba389669ced20e179e6d4e15d5c9c75263925d1404f3c` |
| macOS Apple Silicon DMG | [GameVault-0.8.0-mac-arm64.dmg](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.8.0/GameVault-0.8.0-mac-arm64.dmg) | `3a5814297ee14f19a1f3bf903f8aa067440c2b3add09eb889caf913ed0b05e65` |
| macOS Apple Silicon ZIP | [GameVault-0.8.0-mac-arm64.zip](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.8.0/GameVault-0.8.0-mac-arm64.zip) | `7002cd3f4f03601f8cf900f13d1eeecdcb1928aa6c64d37beba9b91df7203e1d` |
| Optional cloud | [GameVault-Cloud-Setup.zip](downloads/GameVault-Cloud-Setup.zip) | `d791f09a456d16c7e600554aaceb02f93be14036557fd5ed83c272df8c67e979` |

The Android APK is a signed direct-install build. The iPhone IPA is unsigned and must be installed with SideStore, AltStore, or another sideloading tool. Free Apple signing normally needs refreshing every seven days.

## Use it without a server

GameVault starts in local-only mode. Version 0.8.0 adds an endless discovery feed, each month's Top 10 most anticipated games, one-tap Wishlist actions, and opt-in Friend Wishlists that follow the same Steam account across Android, iPhone, web, and desktop. It also makes Themes and Franchises collapsible.

The 24 themes now change the app emblem, surface shapes, shadows, patterns, colors, and typography. Inspired themes use original fan-made homage names and artwork rather than official franchise logos, and GameVault is not affiliated with the referenced rights holders.

Standalone Steam access uses Steam sign-in and the hosted GameVault service for visibility-permitted owned games, playtime, friends, last-played dates, achievements, unlock dates, descriptions, and global rarity. GameVault never receives a Steam password, Steam Guard code, cookie, or browser session. A signed-in desktop relay remains an optional fallback, and devices retain their last successful import if a PC or the service is offline. Manual story and overall progress remain separate.

Searchable, multi-select checkbox filters work in both Collection and Catalog and cover every IGDB genre, theme, game-mode, and keyword value returned for those games, including Action, Horror, Co-op, and Multiplayer. The same Filter menu includes age rating, real Steam full/partial controller support, popular tags, and native Linux or ProtonDB compatibility.

Controller support, Steam tags, and ProtonDB results are loaded from their live metadata services and cached in the database; they are not placeholder labels. A normal saved game or Catalog result with a Steam store link is enough for compatibility enrichment. The Collection home remains tile-based for Playing, Backlog, Wishlist, Completed, Dropped, custom folders, and Franchises. Wishlist is the same as Want to Play and stays outside the owned-only My Library view.

GameVault also includes private/manual friend profiles, cached Steam presence changes, IGDB time-to-beat estimates, multi-store ownership and hours, and an optional ordered Up Next 3. Friend Wishlist sharing is off by default. When enabled, the hosted service stores the Steam ID, public persona/avatar, and the selected Wishlist snapshot so verified Steam friends using GameVault can see it; turning sharing off removes the published game snapshot, and the profile can be deleted from the app.

Signed APK updates retain the existing Android library when installed over the old version, and 0.8.0 checks a signed-hash manifest for later APKs. The Windows setup build and Linux AppImage check the desktop update feed; Windows portable and unsigned macOS packages update manually. Settings can also export and restore a complete local JSON backup without including the private sync token.

## Optional private cloud

Each person should deploy their own Cloudflare Worker and D1 database and keep their token private. Do not share another person's token: a token holder can read and change that cloud library.

See the [cloud setup guide](CLOUD_SETUP.md) and [privacy notes](PRIVACY.md).
The complete release manifest is in [downloads/SHA256SUMS.txt](downloads/SHA256SUMS.txt).

## Privacy of this repository

This repository contains distribution files, a static website, sanitized demonstration screenshots, and a sanitized optional cloud setup kit. It contains no personal library export, notes, sync token, IGDB secret, signing secret, or private database identifier.
