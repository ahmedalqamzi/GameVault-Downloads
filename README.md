# GameVault 0.9.0 downloads

Public downloads, screenshots, and install instructions for GameVault.

## Open the download page

<https://ahmedalqamzi.github.io/GameVault-Downloads/>

## Direct downloads

| Platform | File | SHA-256 |
| --- | --- | --- |
| Android 8+ | [GameVault-Android.apk](downloads/GameVault-Android.apk) | `9cae6dd2260f57ba33cfdf84c9995d6ef9159a130ba0e8919ffe63c4b63e0ac8` |
| iOS 17+ | [GameVault-iOS-unsigned.ipa](downloads/GameVault-iOS-unsigned.ipa) | `67679a66d60a3a506e04c710a677fe3735f9a6df8e4712daacfd0aca0d819fea` |
| Windows setup | [GameVault-0.9.0-windows-x64-setup.exe](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.9.0/GameVault-0.9.0-windows-x64-setup.exe) | `c59000604432f2faa7cbda9462667fbd30290ff3b7574d50e659106f338a85d8` |
| Windows portable | [GameVault-0.9.0-windows-x64-portable.exe](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.9.0/GameVault-0.9.0-windows-x64-portable.exe) | `00b4cbe07877138ae5fd82a85375694d327515d556a0cf83c761b67d11672d8c` |
| Linux x86-64 | [GameVault-0.9.0-linux-x86_64.AppImage](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.9.0/GameVault-0.9.0-linux-x86_64.AppImage) | `7572873b6feaba8614bc75e6c01b8d3d7aed4f6a52b1ca2f57841648d8b32b1b` |
| macOS Apple Silicon DMG | [GameVault-0.9.0-mac-arm64.dmg](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.9.0/GameVault-0.9.0-mac-arm64.dmg) | `b9f5f47e7b83c21fd613cdafa3311e6635fa2c59d5e5c479bcf69d28004e1c08` |
| macOS Apple Silicon ZIP | [GameVault-0.9.0-mac-arm64.zip](https://github.com/ahmedalqamzi/GameVault-Downloads/releases/download/v0.9.0/GameVault-0.9.0-mac-arm64.zip) | `e4cbcd8dc3bf4c9ba3b3aab9d115cd91fda010e0360dac90aa596c823b4822c8` |
| Optional cloud | [GameVault-Cloud-Setup.zip](downloads/GameVault-Cloud-Setup.zip) | `d791f09a456d16c7e600554aaceb02f93be14036557fd5ed83c272df8c67e979` |

The Android APK is a signed direct-install build. The current iPhone build is GameVault 0.9.1 (build 13); its IPA is unsigned and must be installed with SideStore, AltStore, or another sideloading tool. Free Apple signing normally needs refreshing every seven days.

## Use it without a server

GameVault starts in local-only mode. Version 0.9.0 adds an Announcements hub for gaming showcases, conventions, awards, esports, trailers, and season reveals across Android, iPhone, web, and desktop. Exact times use each device's timezone, date-only events remain clearly marked Time TBA, every source has a distinct emblem, and official YouTube videos play in the app. The last successful schedule remains cached when the service is offline.

The endless Feed stays curated around released games with real rating and review evidence, while the monthly Top 10 remains the place for anticipated releases. It keeps one-tap Wishlist actions and opt-in Friend Wishlists across every app.

The 24 themes now change the full interface: contextual emblems, page atmosphere, navigation, headings, surface shapes, buttons, borders, chips, cover frames, shadows, patterns, colors, typography, and reduced-motion-safe animation. GameVault and Inspired theme groups collapse independently, while Franchise navigation and Collection franchise tiles also collapse and remember their state. Inspired themes use original fan-made homage names and artwork rather than official franchise logos, and GameVault is not affiliated with the referenced rights holders.

Standalone Steam access uses Steam sign-in and the hosted GameVault service for visibility-permitted owned games, playtime, friends, last-played dates, achievements, unlock dates, descriptions, and global rarity. GameVault never receives a Steam password, Steam Guard code, cookie, or browser session. A signed-in desktop relay remains an optional fallback, and devices retain their last successful import if a PC or the service is offline. Manual story and overall progress remain separate.

Searchable, multi-select checkbox filters work in both Collection and Catalog and cover every IGDB genre, theme, game-mode, and keyword value returned for those games, including Action, Horror, Co-op, and Multiplayer. The same Filter menu includes age rating, real Steam full/partial controller support, popular tags, and native Linux or ProtonDB compatibility.

Controller support, Steam tags, and ProtonDB results are loaded from their live metadata services and cached in the database; they are not placeholder labels. A normal saved game or Catalog result with a Steam store link is enough for compatibility enrichment. The Collection home remains tile-based for Playing, Backlog, Wishlist, Completed, Dropped, custom folders, and Franchises. Wishlist is the same as Want to Play and stays outside the owned-only My Library view.

GameVault also includes private/manual friend profiles, cached Steam presence changes, IGDB time-to-beat estimates, multi-store ownership and hours, and an optional ordered Up Next 3. Friend Wishlist sharing is off by default. When enabled, the hosted service stores the Steam ID, public persona/avatar, and the selected Wishlist snapshot so verified Steam friends using GameVault can see it; turning sharing off removes the published game snapshot, and the profile can be deleted from the app.

Signed APK updates retain the existing Android library when installed over the old version, and 0.9.0 checks a signed-hash manifest for later APKs. The Windows setup build and Linux AppImage check the desktop update feed; Windows portable and unsigned macOS packages update manually. Settings can also export and restore a complete local JSON backup without including the private sync token.

## Optional private cloud

Each person should deploy their own Cloudflare Worker and D1 database and keep their token private. Do not share another person's token: a token holder can read and change that cloud library.

See the [cloud setup guide](CLOUD_SETUP.md) and [privacy notes](PRIVACY.md).
The complete release manifest is in [downloads/SHA256SUMS.txt](downloads/SHA256SUMS.txt).

## Privacy of this repository

This repository contains distribution files, a static website, sanitized demonstration screenshots, and a sanitized optional cloud setup kit. It contains no personal library export, notes, sync token, IGDB secret, signing secret, or private database identifier.
