# GameVault 0.8.1 downloads

Public downloads, screenshots, and install instructions for GameVault.

## Open the download page

<https://ahmedalqamzi.github.io/GameVault-Downloads/>

## Direct downloads

| Platform | File | SHA-256 |
| --- | --- | --- |
| Android 8+ | [GameVault-Android.apk](downloads/GameVault-Android.apk) | `e7122ccf5bc20b43d765c6f392645b982fbc42b473548f93b8da9a277d800e27` |
| iOS 17+ | [GameVault-iOS-unsigned.ipa](downloads/GameVault-iOS-unsigned.ipa) | `eba8d4be58b913b4bfcba241963811d80f712050fb98d37af3a7feae68c7771c` |
| Windows setup | [GameVault-0.8.1-windows-x64-setup.exe](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.8.1/GameVault-0.8.1-windows-x64-setup.exe) | `afb1832330ee24f0eccdd40a5d82dba3bb1d68ca3f5a5bdeb43c676b7651e491` |
| Windows portable | [GameVault-0.8.1-windows-x64-portable.exe](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.8.1/GameVault-0.8.1-windows-x64-portable.exe) | `0deb5ed5bf95a70aa7e4fdbccabe7e93eab9ee35a2c7e389e5471f8f0a0ddedf` |
| Linux x86-64 | [GameVault-0.8.1-linux-x86_64.AppImage](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.8.1/GameVault-0.8.1-linux-x86_64.AppImage) | `f9a702679476fe08d44c49d7d3341d9c42e094f300f0c3eefb1a2e7ed02f3daf` |
| macOS Apple Silicon DMG | [GameVault-0.8.1-mac-arm64.dmg](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.8.1/GameVault-0.8.1-mac-arm64.dmg) | `d9d3fa05d9eb975208d8d247e3a91d07f62214bdf3559f8b862bae4b0bfb1563` |
| macOS Apple Silicon ZIP | [GameVault-0.8.1-mac-arm64.zip](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.8.1/GameVault-0.8.1-mac-arm64.zip) | `c52ff8418cb9bef1806bc0e37b29dbf894d070ec298b98af5ed2d2640287f288` |
| Optional cloud | [GameVault-Cloud-Setup.zip](downloads/GameVault-Cloud-Setup.zip) | `d791f09a456d16c7e600554aaceb02f93be14036557fd5ed83c272df8c67e979` |

The Android APK is a signed direct-install build. The iPhone IPA is unsigned and must be installed with SideStore, AltStore, or another sideloading tool. Free Apple signing normally needs refreshing every seven days.

## Use it without a server

GameVault starts in local-only mode. Version 0.8.1 curates the endless Feed around released games with real rating and review evidence, while the monthly Top 10 remains the place for anticipated releases. It keeps one-tap Wishlist actions and opt-in Friend Wishlists across Android, iPhone, web, and desktop.

The 24 themes now change the full interface: contextual emblems, page atmosphere, navigation, headings, surface shapes, buttons, borders, chips, cover frames, shadows, patterns, colors, typography, and reduced-motion-safe animation. GameVault and Inspired theme groups collapse independently, while Franchise navigation and Collection franchise tiles also collapse and remember their state. Inspired themes use original fan-made homage names and artwork rather than official franchise logos, and GameVault is not affiliated with the referenced rights holders.

Standalone Steam access uses Steam sign-in and the hosted GameVault service for visibility-permitted owned games, playtime, friends, last-played dates, achievements, unlock dates, descriptions, and global rarity. GameVault never receives a Steam password, Steam Guard code, cookie, or browser session. A signed-in desktop relay remains an optional fallback, and devices retain their last successful import if a PC or the service is offline. Manual story and overall progress remain separate.

Searchable, multi-select checkbox filters work in both Collection and Catalog and cover every IGDB genre, theme, game-mode, and keyword value returned for those games, including Action, Horror, Co-op, and Multiplayer. The same Filter menu includes age rating, real Steam full/partial controller support, popular tags, and native Linux or ProtonDB compatibility.

Controller support, Steam tags, and ProtonDB results are loaded from their live metadata services and cached in the database; they are not placeholder labels. A normal saved game or Catalog result with a Steam store link is enough for compatibility enrichment. The Collection home remains tile-based for Playing, Backlog, Wishlist, Completed, Dropped, custom folders, and Franchises. Wishlist is the same as Want to Play and stays outside the owned-only My Library view.

GameVault also includes private/manual friend profiles, cached Steam presence changes, IGDB time-to-beat estimates, multi-store ownership and hours, and an optional ordered Up Next 3. Friend Wishlist sharing is off by default. When enabled, the hosted service stores the Steam ID, public persona/avatar, and the selected Wishlist snapshot so verified Steam friends using GameVault can see it; turning sharing off removes the published game snapshot, and the profile can be deleted from the app.

Signed APK updates retain the existing Android library when installed over the old version, and 0.8.1 checks a signed-hash manifest for later APKs. The Windows setup build and Linux AppImage check the desktop update feed; Windows portable and unsigned macOS packages update manually. Settings can also export and restore a complete local JSON backup without including the private sync token.

## Optional private cloud

Each person should deploy their own Cloudflare Worker and D1 database and keep their token private. Do not share another person's token: a token holder can read and change that cloud library.

See the [cloud setup guide](CLOUD_SETUP.md) and [privacy notes](PRIVACY.md).
The complete release manifest is in [downloads/SHA256SUMS.txt](downloads/SHA256SUMS.txt).

## Privacy of this repository

This repository contains distribution files, a static website, sanitized demonstration screenshots, and a sanitized optional cloud setup kit. It contains no personal library export, notes, sync token, IGDB secret, signing secret, or private database identifier.
