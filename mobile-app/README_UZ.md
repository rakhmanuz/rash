# rash Mobile App - Android APK

Bu papka **rash** veb-saytining Android mobil ilovasi uchun yaratilgan. Google Play Store-ga yuklash uchun professional darajada tayyorlangan.

## ✅ Nima Yaratildi?

- ✅ **Capacitor-based Android app** - Professional mobil ilova
- ✅ **Production-ready build** - ProGuard, minification, optimization
- ✅ **Google Play ready** - AAB formatida yaratish mumkin
- ✅ **Build scripts** - Windows va Linux/Mac uchun
- ✅ **To'liq dokumentatsiya** - Barcha qadamlar tushuntirilgan

## 🚀 Tezkor Boshlash

### 1. Dependencies o'rnatish
```bash
cd mobile-app
npm install
```

### 2. APK yaratish

**Windows:**
```powershell
.\build-apk.ps1
```

**Linux/Mac:**
```bash
chmod +x build-apk.sh
./build-apk.sh
```

### 3. APK topiladi
```
mobile-app/android/app/build/outputs/apk/release/app-release.apk
```

## 🎯 Google Play uchun AAB

Google Play Store-ga yuklash uchun AAB formatida:

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

## 🔐 Keystore Yaratish (Birinchi marta)

Google Play-ga yuklash uchun keystore yaratish kerak:

```bash
cd mobile-app/android/app
keytool -genkey -v -keystore release.keystore -alias rash-release -keyalg RSA -keysize 2048 -validity 10000
```

Keyin `mobile-app/android/keystore.properties` fayl yaratib, ma'lumotlarni kiriting.

**Batafsil:** [CREATE_KEYSTORE.md](CREATE_KEYSTORE.md)

## 📱 Ilova Xususiyatlari

- ✅ **Production server** - `https://rash.uz` dan yuklanadi
- ✅ **Offline support** - Caching va offline ishlash
- ✅ **Native features** - Status bar, splash screen, keyboard
- ✅ **Optimized** - ProGuard, minification, code shrinking
- ✅ **Secure** - HTTPS, security headers

## 📚 Qo'llanmalar

- **START_HERE.md** - Boshlash uchun asosiy ma'lumot
- **QUICK_START.md** - Tezkor boshlash qo'llanmasi
- **README.md** - To'liq qo'llanma (English)
- **CREATE_KEYSTORE.md** - Keystore yaratish
- **SETUP_ICONS.md** - App icon o'rnatish
- **DEVELOPMENT.md** - Local development

## ⚙️ Konfiguratsiya

### App ID o'zgartirish

`capacitor.config.ts` va `android/app/build.gradle` fayllarida:
- `appId: 'uz.rash.app'` → O'zgartiring
- `applicationId "uz.rash.app"` → O'zgartiring

### Versiya yangilash

`android/app/build.gradle` faylida:
```gradle
versionCode 2  // Har safar +1
versionName "1.0.1"  // Versiya nomi
```

### Server URL

`capacitor.config.ts` faylida:
```typescript
server: {
  url: 'https://rash.uz',  // Production
  // yoki
  // url: 'http://localhost:3000',  // Development
}
```

## 🐛 Muammolarni Hal Qilish

### Build xatosi
```bash
cd mobile-app/android
./gradlew clean
cd ..
npx cap sync
```

### Dependencies xatosi
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

## 📦 Google Play Store Upload

1. Google Play Console-ga kiring
2. New App yaratish
3. AAB faylni yuklang (`app-release.aab`)
4. Store listing to'ldiring:
   - App name: rash
   - Short description: rash - raqamli ekotizim
   - Full description: To'liq tavsif
   - Screenshots qo'shing
   - App icon qo'shing
5. Content rating o'tkazing
6. Release → Production → Review

## ⚠️ Muhim Eslatmalar

1. ✅ **Sayt kodi o'zgartirilmadi** - faqat mobile app qo'shildi
2. ✅ **Keystore parolini** yaxshi eslab qoling va backup qiling
3. ✅ **Version code** har safar yangilanganda oshiring
4. ✅ **Test qiling** - har bir buildni real qurilmada sinab ko'ring

## 🎯 Keyingi Qadamlar

1. ✅ Dependencies o'rnatish
2. ✅ Keystore yaratish (bir marta)
3. ✅ APK/AAB yaratish
4. ✅ Google Play Console-ga yuklash
5. ✅ Store listing to'ldirish
6. ✅ Review va publish

## 📞 Yordam

- Capacitor: https://capacitorjs.com/docs
- Android: https://developer.android.com
- Google Play: https://support.google.com/googleplay/android-developer

---

**Tayyor!** 🎉 Endi professional Android ilovangiz Google Play Store-ga yuklashga tayyor!

**Tayyorlangan:** rash.uz jamoasi  
**Versiya:** 1.0.0  
**Sana:** 2024
