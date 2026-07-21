# Set up your own GameVault cloud

Cloud is optional. GameVault works as a phone-only library with no account or server.

Use a personal cloud when you want:

- Backup outside one device
- Autosync between your phone, web app, and other installations

The installed app already gets IGDB-powered search, the discovery feed, artwork, release dates, scores, trailer links, Steam tags and controller data, Proton/Linux compatibility, standalone Steam access, and opt-in Friend Wishlists without a personal cloud or token. Adding IGDB credentials to your own Worker is optional; the app falls back to its hosted metadata service if your Worker has none. The hosted GameVault service owns its operator Steam credential, so individual phone users never need a key. Steam OpenID and the outbound desktop fallback do not expose passwords or Steam Guard codes.

## The easiest route

1. Download [GameVault-Cloud-Setup.zip](downloads/GameVault-Cloud-Setup.zip).
2. Extract it on a Windows, macOS, or Linux computer.
3. Install [Node.js 22 or newer](https://nodejs.org/) and create a free [Cloudflare account](https://dash.cloudflare.com/sign-up). An operator [Steam Web API key](https://steamcommunity.com/dev/apikey) is optional if you also want this Worker to support direct visibility-permitted Steam reads; normal app users never need their own key.
4. Run `setup-cloud.sh` on macOS/Linux or `setup-cloud.ps1` on Windows.
5. Copy the final Worker URL and generated token into **GameVault → Settings → Optional Cloud**.
6. Choose **Save connection**, then **Sync**.

The helper creates a private D1 database, generates separate random sync and Steam-session secrets, applies the complete additive schema, and deploys the API. IGDB credentials and the optional Steam key are prompted into Worker secrets, never stored in the app or setup files.

## Keep this private

The service is designed for one owner. Anyone holding the token can read and change that cloud library. Do not use another person's URL/token pair and do not give yours to friends. Each person should deploy a separate kit.

The download contains no preconfigured account, database ID, sync token, IGDB credential, or personal library.
