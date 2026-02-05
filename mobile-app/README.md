# rash Mobile App - Android APK Build Guide

Bu papka rash veb-saytining Android mobil ilovasi uchun yaratilgan. Capacitor texnologiyasi yordamida professional darajada APK yaratish uchun tayyorlangan.

## 📋 Talablar

1. **Node.js** (v18 yoki yuqori)
2. **Java JDK** (17 yoki yuqori)
3. **Android Studio** (yoki Android SDK)
4. **Gradle** (avtomatik o'rnatiladi)

## 🚀 O'rnatish

### 1. Dependencies o'rnatish

```bash
cd mobile-app
npm install
```

### 2. Asosiy loyihani build qilish

Avval asosiy Next.js loyihasini build qiling:

```bash
cd ..
npm run build
```

### 3. Capacitor sync

```bash
cd mobile-app
npm run sync
```

## 📱 APK Yaratish

### Development APK (Debug)

```bash
npm run open:android
```

Android Studio ochiladi, u yerda:
1. Build → Build Bundle(s) / APK(s) → Build APK(s)
2. Yoki terminalda: `npm run android:build`

### Production APK (Release)

#### 1. Keystore yaratish (bir marta)

```bash
cd android/app
keytool -genkey -v -keystore release.keystore -alias rash-release -keyalg RSA -keysize 2048 -validity 10000
```

**Muhim:** Parollarni eslab qoling va xavfsiz joyda saqlang!

#### 2. Environment variables sozlash

`.env` fayl yaratish yoki environment variables:

```bash
export KEYSTORE_PASSWORD="your-keystore-password"
export KEYSTORE_ALIAS_PASSWORD="your-alias-password"
```

#### 3. Release APK build

```bash
npm run android:build
```

APK fayl: `android/app/build/outputs/apk/release/app-release.apk`

#### 4. AAB (Android App Bundle) - Google Play uchun

Google Play Store uchun AAB formatida yaratish:

```bash
npm run android:build:bundle
```

AAB fayl: `android/app/build/outputs/bundle/release/app-release.aab`

## 🔐 Google Play Store uchun tayyorlash

### 1. App Signing

Google Play Console-da App Signing yoqilgan bo'lsa, upload key yaratish:

```bash
keytool -genkey -v -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Version Code va Version Name

`android/app/build.gradle` faylida:

```gradle
versionCode 1  // Har safar yangilanganda oshiring
versionName "1.0.0"  // Versiya nomi
```

### 3. App Icons

Icons fayllarini `android/app/src/main/res/mipmap-*/` papkalariga qo'ying:
- `ic_launcher.png` (48x48, 72x72, 96x96, 144x144, 192x192, 512x512)
- `ic_launcher_round.png` (yumaloq versiya)

### 4. Screenshots va Metadata

Google Play Console-da:
- Screenshots qo'shing (telefon, 7" tablet, 10" tablet)
- App description (Uzbek va English)
- Category: Education
- Content rating
- Privacy policy URL

## 📦 Build Scripts

- `npm run build` - Web build + Capacitor sync
- `npm run sync` - Capacitor sync
- `npm run open:android` - Android Studio ochish
- `npm run android:build` - Release APK yaratish
- `npm run android:build:bundle` - AAB yaratish (Play Store uchun)
- `npm run android:clean` - Build cache tozalash

## ⚙️ Konfiguratsiya

### App ID o'zgartirish

`capacitor.config.ts` faylida:
```typescript
appId: 'uz.rash.app'  // O'zgartiring
```

`android/app/build.gradle` va `AndroidManifest.xml` fayllarida ham o'zgartiring.

### Server URL

Agar production server boshqacha bo'lsa, `capacitor.config.ts` da:

```typescript
server: {
    url: 'https://rash.uz',
    androidScheme: 'https'
}
```

## 🐛 Muammolarni hal qilish

### Build xatosi

```bash
npm run android:clean
npm run sync
```

### Gradle xatosi

```bash
cd android
./gradlew clean
```

### Capacitor sync xatosi

```bash
rm -rf android
npm run sync
```

## 📝 Eslatmalar

1. **Keystore parolini** hech qachon gitga commit qilmang
2. **Version code** har safar yangilanganda oshiring
3. **Test qiling** - har bir buildni real qurilmada sinab ko'ring
4. **ProGuard** release buildda yoqilgan - kod optimizatsiya qilinadi

## 🎯 Google Play Store Upload

1. Google Play Console-ga kiring
2. New App yaratish
3. AAB faylni yuklang (`app-release.aab`)
4. Store listing to'ldiring
5. Content rating o'tkazing
6. Release → Production → Review

## 📞 Yordam

Muammo bo'lsa:
- Capacitor docs: https://capacitorjs.com/docs
- Android docs: https://developer.android.com

---

**Tayyorlangan:** rash.uz jamoasi  
**Versiya:** 1.0.0  
**Sana:** 2024
