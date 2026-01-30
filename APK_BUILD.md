# APK Yaratish Qo'llanmasi

Bu qo'llanma Next.js web ilovasini Android APK'ga aylantirish uchun.

## ⚠️ Muhim Eslatma

Next.js ilovangiz API route'lar ishlatadi, shuning uchun **static export ishlamaydi**. APK yaratish uchun **server URL** yondashuvidan foydalanamiz.

## 📋 Talablar

- Node.js 18+ yoki 20+
- Android Studio (APK yaratish uchun)
- Java JDK 11+ (Android Studio bilan keladi)
- Android SDK
- **Production server ishlayotgan bo'lishi kerak** (https://rash.uz)

## 🚀 Qadamlar

### 1. Production Server Ishga Tushirish

APK ishlashi uchun production server ishlayotgan bo'lishi kerak:

```bash
# VPS'da yoki production server'da
npm run build
npm start
# yoki
pm2 start ecosystem.config.js
```

### 2. Capacitor Config Sozlash

`capacitor.config.ts` faylida server URL'ni o'zgartiring:

```typescript
server: {
  url: 'https://rash.uz', // Production server URL
  androidScheme: 'https',
}
```

### 3. Capacitor Sync

```bash
npx cap sync
```

### 4. Android Studio'da Ochish

```bash
npx cap open android
```

### 5. APK Yaratish

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

### 6. Release APK Yaratish (Google Play uchun)

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
    url: 'https://rash.uz', // Production server URL
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  }
};

export default config;
```

## 📱 PWA Sozlash

PWA allaqachon sozlangan:
- `public/manifest.json` - PWA manifest
- `app/layout.tsx` - Meta taglar

## 🔄 Keyingi O'zgarishlarni Sync Qilish

Har safar kod o'zgarganda:

```bash
# 1. Production server'da rebuild
npm run build
npm start

# 2. Capacitor sync (agar config o'zgarganda)
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
- **Server URL:** Production server ishlayotgan bo'lishi kerak
- Har safar build qilganda `npx cap sync` qiling (agar config o'zgarganda)
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

### Server ulanmayapti?

- Production server ishlayotganligini tekshiring
- `capacitor.config.ts` da URL to'g'ri ekanligini tekshiring
- Internet ruxsatini tekshiring (AndroidManifest.xml)

## ✅ Checklist

- [ ] Production server ishlayapti (https://rash.uz)
- [ ] Capacitor config'da server URL to'g'ri
- [ ] Capacitor sync muvaffaqiyatli
- [ ] Android Studio'da loyiha ochilgan
- [ ] APK yaratilgan
- [ ] APK test qilingan (emulator yoki real device)
- [ ] Release APK yaratilgan (agar kerak bo'lsa)
