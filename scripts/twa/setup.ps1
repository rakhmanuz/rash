$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$outDir = Join-Path $repoRoot "android-twa"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Write-Host ""
Write-Host "rash.uz TWA — interaktiv Bubblewrap init" -ForegroundColor Green
Write-Host "Avtomatik yo'l (tavsiya): repoda npm run twa:sync-manifest -> twa:update -> twa:build" -ForegroundColor Yellow
Write-Host "Server .env: ANDROID_TWA_PACKAGE_NAME, ANDROID_TWA_SHA256_CERT_FINGERPRINTS" -ForegroundColor Cyan
Write-Host ""

Set-Location $repoRoot
npx --yes @bubblewrap/cli@latest init --manifest "https://rash.uz/manifest.json" --directory $outDir
