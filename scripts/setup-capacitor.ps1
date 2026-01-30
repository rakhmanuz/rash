# Capacitor setup script (PowerShell) - APK yaratish uchun
# Bu script Next.js ilovasini Android APK'ga aylantiradi

Write-Host "📱 Capacitor setup boshlandi..." -ForegroundColor Green

# 1. Capacitor o'rnatish
Write-Host "📦 Capacitor o'rnatilmoqda..." -ForegroundColor Yellow
npm install @capacitor/core @capacitor/cli @capacitor/android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor o'rnatishda xatolik!" -ForegroundColor Red
    exit 1
}

# 2. Capacitor init
Write-Host "🔧 Capacitor sozlanmoqda..." -ForegroundColor Yellow
npx cap init "rash.uz" "com.rash.app" --web-dir=".next"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor init xatolik!" -ForegroundColor Red
    exit 1
}

# 3. Android platform qo'shish
Write-Host "🤖 Android platform qo'shilmoqda..." -ForegroundColor Yellow
npx cap add android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Android platform qo'shishda xatolik!" -ForegroundColor Red
    exit 1
}

# 4. Build yaratish
Write-Host "🏗️ Production build yaratilmoqda..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build muvaffaqiyatsiz!" -ForegroundColor Red
    exit 1
}

# 5. Capacitor sync
Write-Host "🔄 Capacitor sync qilinmoqda..." -ForegroundColor Yellow
npx cap sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync xatolik!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Capacitor setup muvaffaqiyatli yakunlandi!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Keyingi qadamlar:" -ForegroundColor Cyan
Write-Host "1. Android Studio o'rnating" -ForegroundColor White
Write-Host "2. Android Studio'da oching: npx cap open android" -ForegroundColor White
Write-Host "3. APK yaratish: Build > Build Bundle(s) / APK(s) > Build APK(s)" -ForegroundColor White
Write-Host ""
Write-Host "Yoki command line:" -ForegroundColor Cyan
Write-Host "  cd android" -ForegroundColor White
Write-Host "  ./gradlew assembleRelease" -ForegroundColor White
Write-Host "  # APK: android/app/build/outputs/apk/release/app-release.apk" -ForegroundColor White
