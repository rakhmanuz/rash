# APK Yaratish Qo'llanmasi

Bu qo'llanma Next.js web ilovasini Android APK'ga aylantirish uchun.

## 📋 Talablar

- Node.js 18+ yoki 20+
- Android Studio (APK yaratish uchun)
- Java JDK 11+ (Android Studio bilan keladi)
- Android SDK

## 🚀 Qadamlar

### 1. Capacitor O'rnatish va Sozlash

**Windows:**
```powershell
.\scripts\setup-capacitor.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/setup-capacitor.sh
./scripts/setup-capacitor.sh
```

**Yoki qo'lda:**
```bash
# Capacitor o'rnatish
npm install @capacitor/core @capacitor/cli @capacitor/android

# Capacitor init
npx cap init "rash.uz" "com.rash.app" --web-dir=".next"

# Android platform qo'shish
npx cap add android

# Production build
npm run build

# Capacitor sync
npx cap sync
```

### 2. Android Studio'da Ochish

```bash
npx cap open android
```

Bu komanda Android Studio'ni ochadi va loyihani yuklaydi.

### 3. APK Yaratish

#### Variant A: Android Studio GUI orqali

1. Android Studio'da loyihani oching
2. **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**
3. Build tugagach, **locate** tugmasini bosing
4. APK fayl: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Variant B: Command Line orqali

```bash
cd android
./gradlew assembleDebug
# yoki release uchun
./gradlew assembleRelease
```

**APK joylashuvi:**
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

### 4. Release APK Yaratish (Google Play uchun)

1. **android/app/build.gradle** faylida signing config sozlang
2. **Build** > **Generate Signed Bundle / APK**
3. **APK** ni tanlang
4. KeyStore yarating yoki mavjud KeyStore'dan foydalaning
5. APK yaratiladi

## 🔧 Capacitor Config

`capacitor.config.ts` faylida quyidagilarni sozlang:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rash.app',
  appName: 'rash.uz',
  webDir: '.next',
  server: {
    androidScheme: 'https',
    // Development uchun:
    // url: 'http://localhost:3000',
    // cleartext: true
  },
  android: {
    allowMixedContent: true,
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
    }
  }
};

export default config;
```

## 📱 PWA Sozlash

PWA allaqachon sozlangan:
- `public/manifest.json` - PWA manifest
- `app/layout.tsx` - Meta taglar
- Service Worker (keyinroq qo'shiladi)

## 🔄 Keyingi O'zgarishlarni Sync Qilish

Har safar kod o'zgarganda:

```bash
# 1. Build yaratish
npm run build

# 2. Capacitor sync
npx cap sync

# 3. Android Studio'da rebuild
# Yoki command line:
cd android
./gradlew assembleDebug
```

## 📦 APK O'lchami Optimizatsiyasi

APK o'lchamini kamaytirish uchun:

1. **ProGuard** yoqish (`android/app/build.gradle`):
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

2. **Split APKs** yaratish (ABI bo'yicha):
```gradle
splits {
    abi {
        enable true
        reset()
        include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
        universalApk false
    }
}
```

## 🧪 Testing

### Emulator'da Test Qilish

```bash
# Android Studio'da emulator ishga tushiring
# Keyin:
npx cap run android
```

### Real Device'da Test Qilish

1. USB debugging yoqing (Settings > Developer options)
2. Device'ni ulang
3. Android Studio'da device'ni tanlang
4. **Run** tugmasini bosing

## 📝 Eslatmalar

- **Web Dir:** `.next` (Next.js build output)
- **App ID:** `com.rash.app` (o'zgartirish mumkin)
- **App Name:** `rash.uz` (o'zgartirish mumkin)
- Har safar build qilganda `npx cap sync` qiling
- Release APK yaratish uchun KeyStore kerak

## 🆘 Muammolarni Hal Qilish

### Capacitor sync xatolik?

```bash
# Capacitor cache tozalash
rm -rf node_modules/.cache
npx cap sync
```

### Android build xatolik?

```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### APK o'lchami juda katta?

- ProGuard yoqing
- Unused resources'ni o'chiring
- Split APKs yarating

## ✅ Checklist

- [ ] Capacitor o'rnatilgan
- [ ] Android platform qo'shilgan
- [ ] Production build muvaffaqiyatli
- [ ] Capacitor sync muvaffaqiyatli
- [ ] Android Studio'da loyiha ochilgan
- [ ] APK yaratilgan
- [ ] APK test qilingan (emulator yoki real device)
- [ ] Release APK yaratilgan (agar kerak bo'lsa)
