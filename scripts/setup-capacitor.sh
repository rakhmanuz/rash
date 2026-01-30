#!/bin/bash

# Capacitor setup script - APK yaratish uchun
# Bu script Next.js ilovasini Android APK'ga aylantiradi

set -e

echo "📱 Capacitor setup boshlandi..."

# 1. Capacitor o'rnatish
echo "📦 Capacitor o'rnatilmoqda..."
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Capacitor init
echo "🔧 Capacitor sozlanmoqda..."
npx cap init "rash.uz" "com.rash.app" --web-dir=".next"

# 3. Android platform qo'shish
echo "🤖 Android platform qo'shilmoqda..."
npx cap add android

# 4. Build yaratish
echo "🏗️ Production build yaratilmoqda..."
npm run build

# 5. Capacitor sync
echo "🔄 Capacitor sync qilinmoqda..."
npx cap sync

echo "✅ Capacitor setup muvaffaqiyatli yakunlandi!"
echo ""
echo "📝 Keyingi qadamlar:"
echo "1. Android Studio o'rnating"
echo "2. Android Studio'da oching: npx cap open android"
echo "3. APK yaratish: Build > Build Bundle(s) / APK(s) > Build APK(s)"
echo ""
echo "Yoki command line:"
echo "  cd android"
echo "  ./gradlew assembleRelease"
echo "  # APK: android/app/build/outputs/apk/release/app-release.apk"
