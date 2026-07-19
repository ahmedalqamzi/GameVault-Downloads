$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "Node.js 22 or newer is required: https://nodejs.org/"
}

$nodeMajor = [int]((node -p "process.versions.node.split('.')[0]").Trim())
if ($nodeMajor -lt 22) {
  throw "Node.js 22 or newer is required. Installed: $(node --version)"
}

Write-Host "Installing the GameVault cloud tools..."
npm install

Write-Host "Cloudflare will open a browser so you can sign in."
npx wrangler login

$databaseName = Read-Host "Database name [gamevault]"
if ([string]::IsNullOrWhiteSpace($databaseName)) { $databaseName = "gamevault" }

Write-Host "Creating your private D1 database..."
npx wrangler d1 create $databaseName --binding DB --update-config -c workers/api/wrangler.jsonc

$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$syncToken = [Convert]::ToHexString($bytes).ToLowerInvariant()
Set-Content -Path ".gamevault-sync-token" -Value $syncToken -NoNewline
$syncToken | npx wrangler secret put SYNC_TOKEN -c workers/api/wrangler.jsonc

$addIgdb = Read-Host "Add IGDB artwork, search, release dates, and trailers now? [y/N]"
if ($addIgdb -match '^[Yy]$') {
  Write-Host "Wrangler will securely prompt for your Twitch/IGDB Client ID."
  npx wrangler secret put IGDB_CLIENT_ID -c workers/api/wrangler.jsonc
  Write-Host "Now enter the Client Secret."
  npx wrangler secret put IGDB_CLIENT_SECRET -c workers/api/wrangler.jsonc
}

Write-Host "Creating the GameVault tables..."
npx wrangler d1 migrations apply DB --remote -c workers/api/wrangler.jsonc

Write-Host "Deploying your private API..."
npx wrangler deploy -c workers/api/wrangler.jsonc

Write-Host ""
Write-Host "Cloud setup finished."
Write-Host "1. Copy the workers.dev URL printed above into GameVault Settings."
Write-Host "2. Copy this personal sync token into GameVault Settings:"
Write-Host ""
Write-Host $syncToken
Write-Host ""
Write-Host "A private backup of the token is stored in cloud/.gamevault-sync-token."
Write-Host "Never share it: anyone with the token can read and change this cloud library."
