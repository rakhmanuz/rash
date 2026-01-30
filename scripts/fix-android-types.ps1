# Android Types Papkasini O'chirish Script

Write-Host "🔧 Android types papkasini tozalash..." -ForegroundColor Yellow

$typesPath = "android\app\src\main\assets\public\types"

if (Test-Path $typesPath) {
    Write-Host "🗑️ Types papkasi o'chirilmoqda..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force $typesPath
    Write-Host "  ✅ Types papkasi o'chirildi" -ForegroundColor Green
} else {
    Write-Host "  ℹ️ Types papkasi yo'q" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Tozalash yakunlandi!" -ForegroundColor Green
Write-Host ""
Write-Host "Eslatma: Types papkasi server-side uchun, mobile app'ga kerak emas." -ForegroundColor Yellow
Write-Host "Capacitor sync jarayonida bu papka qayta yaratilishi mumkin." -ForegroundColor Yellow
Write-Host "Agar muammo davom etsa, Capacitor config'da exclude qiling." -ForegroundColor Yellow
