# Build Cache Tozalash Script

Write-Host "🧹 Build cache tozalanmoqda..." -ForegroundColor Yellow

cd $PSScriptRoot\..

# .next papkasini o'chirish
if (Test-Path ".next") {
    Write-Host "🗑️ .next papkasi o'chirilmoqda..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force ".next"
    Write-Host "  ✅ .next o'chirildi" -ForegroundColor Green
}

# node_modules cache o'chirish
if (Test-Path "node_modules\.cache") {
    Write-Host "🗑️ node_modules cache o'chirilmoqda..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "  ✅ Cache o'chirildi" -ForegroundColor Green
}

# TypeScript build info o'chirish
$tsBuildInfo = Get-ChildItem -Path . -Filter "*.tsbuildinfo" -Recurse -ErrorAction SilentlyContinue
if ($tsBuildInfo) {
    Write-Host "🗑️ TypeScript build info o'chirilmoqda..." -ForegroundColor Cyan
    $tsBuildInfo | Remove-Item -Force
    Write-Host "  ✅ TypeScript build info o'chirildi" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Build cache tozalash yakunlandi!" -ForegroundColor Green
Write-Host ""
Write-Host "Keyingi qadam:" -ForegroundColor Yellow
Write-Host "  npm run build" -ForegroundColor White
