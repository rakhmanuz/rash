# 🚀 Tezkor Boshlash - APK Yaratish

Bu qo'llanma sizga rash mobil ilovasi uchun APK yaratishni tez va oson qiladi.

## 📋 Oldindan Talablar

1. ✅ **Node.js** o'rnatilgan (v18+)
2. ✅ **Java JDK 17** o'rnatilgan
3. ✅ **Android Studio** yoki **Android SDK** o'rnatilgan

## ⚡ 3 Bosqichda APK Yaratish

### 1️⃣ Dependencies o'rnatish

```bash
cd mobile-app
npm install
```

### 2️⃣ Web app build qilish

```bash
cd ..
npm run build
cd mobile-app
```

### 3️⃣ APK yaratish

**Windows:**
```powershell
.\build-apk.ps1
```

**Linux/Mac:**
```bash
chmod +x build-apk.sh
./build-apk.sh
```

**Yoki manual:**
```bash
npx cap sync
cd android
./gradlew assembleRelease  # Linux/Mac
.\gradlew.bat assembleRelease  # Windows
```

## 📱 APK Topiladi

APK fayl quyidagi joyda:
```
mobile-app/android/app/build/outputs/apk/release/app-release.apk
```

## 🎯 Google Play uchun AAB Yaratish

Google Play Store-ga yuklash uchun AAB (Android App Bundle) formatida yaratish:

**Windows:**
```powershell
.\build-aab.ps1
```

**Linux/Mac:**
```bash
chmod +x build-aab.sh
./build-aab.sh
```

AAB fayl:
```
mobile-app/android/app/build/outputs/bundle/release/app-release.aab
```

## 🔐 Release Signing (Bir marta)

Google Play-ga yuklash uchun keystore yaratish:

```bash
cd mobile-app/android/app
keytool -genkey -v -keystore release.keystore -alias rash-release -keyalg RSA -keysize 2048 -validity 10000
```

Keyin `mobile-app/android/keystore.properties` fayl yaratib, ma'lumotlarni kiriting:

```properties
MYAPP_RELEASE_STORE_FILE=app/release.keystore
MYAPP_RELEASE_STORE_PASSWORD=your-keystore-password
MYAPP_RELEASE_KEY_ALIAS=rash-release
MYAPP_RELEASE_KEY_PASSWORD=your-alias-password
```

⚠️ **Muhim:** `keystore.properties` faylini gitga commit qilmang!

## 📝 Versiya Yangilash

Har safar yangi versiya yaratishda `android/app/build.gradle` faylida:

```gradle
versionCode 2  // Har safar +1 qiling
versionName "1.0.1"  // Versiya nomi
```

## 🐛 Muammolar?

### Build xatosi
```bash
cd mobile-app/android
./gradlew clean
cd ..
npx cap sync
```

### Node modules xatosi
```bash
cd mobile-app
rm -rf node_modules
npm install
```

### Capacitor sync xatosi
```bash
cd mobile-app
rm -rf android
npx cap sync
```

## 📚 Batafsil Ma'lumot

To'liq qo'llanma: [README.md](README.md)

---

**Tayyor!** 🎉 Endi APK yoki AAB faylni Google Play Console-ga yuklashingiz mumkin!
