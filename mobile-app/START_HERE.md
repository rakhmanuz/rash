# 🎯 START HERE - rash Mobile App

Bu papka **rash** veb-saytining Android mobil ilovasi uchun yaratilgan. Google Play Store-ga yuklash uchun professional darajada tayyorlangan.

## 📁 Papka Strukturasi

```
mobile-app/
├── android/              # Android loyiha
├── package.json          # Dependencies
├── capacitor.config.ts   # Capacitor konfiguratsiyasi
├── README.md            # To'liq qo'llanma
├── QUICK_START.md       # Tezkor boshlash
├── CREATE_KEYSTORE.md   # Keystore yaratish
└── SETUP_ICONS.md       # Icon o'rnatish
```

## ⚡ Tezkor Boshlash (3 qadam)

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

## 🔐 Birinchi Marta - Keystore Yaratish

Google Play-ga yuklash uchun keystore yaratish kerak (bir marta):

```bash
cd mobile-app/android/app
keytool -genkey -v -keystore release.keystore -alias rash-release -keyalg RSA -keysize 2048 -validity 10000
```

Keyin `mobile-app/android/keystore.properties` fayl yaratib, ma'lumotlarni kiriting (qarang: `keystore.properties.example`)

## 📚 Qo'shimcha Ma'lumot

- **To'liq qo'llanma**: [README.md](README.md)
- **Tezkor boshlash**: [QUICK_START.md](QUICK_START.md)
- **Keystore yaratish**: [CREATE_KEYSTORE.md](CREATE_KEYSTORE.md)
- **Icon o'rnatish**: [SETUP_ICONS.md](SETUP_ICONS.md)

## ⚙️ Muhim Eslatmalar

1. ✅ **Sayt kodi o'zgartirilmadi** - faqat mobile app qo'shildi
2. ✅ **Production server** - ilova `https://rash.uz` dan yuklanadi
3. ✅ **Professional build** - ProGuard, minification, optimization yoqilgan
4. ✅ **Google Play ready** - AAB formatida yaratish mumkin

## 🐛 Muammo?

1. **Build xatosi?** → `cd android && ./gradlew clean && cd .. && npx cap sync`
2. **Dependencies xatosi?** → `rm -rf node_modules && npm install`
3. **Capacitor sync xatosi?** → `rm -rf android && npx cap sync`

## 📞 Yordam

- Capacitor: https://capacitorjs.com/docs
- Android: https://developer.android.com

---

**Tayyor!** 🚀 Endi APK yoki AAB yaratib, Google Play-ga yuklashingiz mumkin!
