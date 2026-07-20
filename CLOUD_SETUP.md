# Set up your own GameVault cloud

Cloud is optional. GameVault works as a phone-only library with no account or server.

Use a personal cloud when you want:

- Backup outside one device
- Autosync between your phone, web app, and other installations

The installed APK already gets IGDB-powered search, artwork, release dates, scores, trailer links, and controller/Linux compatibility without a personal cloud or token. Adding IGDB credentials to your own Worker is optional; the app falls back to its built-in read-only metadata service if your Worker has none. Steam library and playtime import requires a Steam Web API key on the Worker serving that request.

## The easiest route

1. Download [GameVault-Cloud-Setup.zip](downloads/GameVault-Cloud-Setup.zip).
2. Extract it on a Windows, macOS, or Linux computer.
3. Install [Node.js 22 or newer](https://nodejs.org/) and create a free [Cloudflare account](https://dash.cloudflare.com/sign-up). A [Steam Web API key](https://steamcommunity.com/dev/apikey) is optional unless you want Steam library import.
4. Run `setup-cloud.sh` on macOS/Linux or `setup-cloud.ps1` on Windows.
5. Copy the final Worker URL and generated token into **GameVault → Settings → Optional Cloud**.
6. Choose **Save connection**, then **Sync**.

The helper creates a private D1 database, generates a random token, applies the complete schema, and deploys the API. IGDB credentials and the Steam key are optional prompts stored as Worker secrets, never in the app or setup files.

## Keep this private

The service is designed for one owner. Anyone holding the token can read and change that cloud library. Do not use another person's URL/token pair and do not give yours to friends. Each person should deploy a separate kit.

The download contains no preconfigured account, database ID, sync token, IGDB credential, or personal library.
