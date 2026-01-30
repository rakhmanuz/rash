# To'liq Build Tozalash Script

Write-Host "🧹 To'liq build tozalash boshlandi..." -ForegroundColor Yellow

cd $PSScriptRoot\..

# 1. .next papkasini o'chirish
if (Test-Path ".next") {
    Write-Host "🗑️ .next papkasi o'chirilmoqda..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force ".next"
    Write-Host "  ✅ .next o'chirildi" -ForegroundColor Green
}

# 2. TypeScript build info o'chirish
$tsBuildInfo = Get-ChildItem -Path . -Filter "*.tsbuildinfo" -Recurse -ErrorAction SilentlyContinue
if ($tsBuildInfo) {
    Write-Host "🗑️ TypeScript build info o'chirilmoqda..." -ForegroundColor Cyan
    $tsBuildInfo | Remove-Item -Force
    Write-Host "  ✅ TypeScript build info o'chirildi ($($tsBuildInfo.Count) fayl)" -ForegroundColor Green
}

# 3. node_modules cache o'chirish
if (Test-Path "node_modules\.cache") {
    Write-Host "🗑️ node_modules cache o'chirilmoqda..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "  ✅ Cache o'chirildi" -ForegroundColor Green
}

# 4. Android assets types o'chirish
$androidTypes = "android\app\src\main\assets\public\types"
if (Test-Path $androidTypes) {
    Write-Host "🗑️ Android types papkasi o'chirilmoqda..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force $androidTypes
    Write-Host "  ✅ Android types o'chirildi" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ To'liq tozalash yakunlandi!" -ForegroundColor Green
Write-Host ""
Write-Host "Keyingi qadamlar:" -ForegroundColor Yellow
Write-Host "1. npm run build" -ForegroundColor White
Write-Host "2. Agar xatolik bo'lsa, npm ci (dependencies qayta o'rnatish)" -ForegroundColor White
