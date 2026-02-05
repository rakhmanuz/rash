# Professional APK Yaratish - To'liq Qo'llanma

## 🔐 1. Keystore Yaratish (Birinchi marta)

### Windows PowerShell:

```powershell
cd C:\IQMax\mobile-app\android\app
keytool -genkey -v -keystore release.keystore -alias rash-release -keyalg RSA -keysize 2048 -validity 10000
```

**So'raladigan ma'lumotlar:**
- Keystore password: (parol yarating va eslab qoling!)
- Re-enter password: (takrorlang)
- First and last name: rash.uz
- Organizational Unit: (ixtiyoriy)
- Organization: rash.uz
- City: (shahringiz)
- State: (viloyatingiz)
- Country code: UZ

### 2. Keystore Properties Fayl Yaratish

`mobile-app/android/keystore.properties` fayl yaratib, quyidagilarni kiriting:

```properties
MYAPP_RELEASE_STORE_FILE=app/release.keystore
MYAPP_RELEASE_STORE_PASSWORD=your-keystore-password
MYAPP_RELEASE_KEY_ALIAS=rash-release
MYAPP_RELEASE_KEY_PASSWORD=your-alias-password
```

⚠️ **MUHIM:** Bu faylni gitga commit qilmang!

## 📱 2. Professional APK Yaratish

### Build Script:

```powershell
cd C:\IQMax\mobile-app
.\build-apk.ps1
```

### Yoki Manual:

```powershell
cd C:\IQMax\mobile-app\android
.\gradlew.bat assembleRelease
```

## ✅ 3. APK Joylashuvi

**Signed APK:**
```
C:\IQMax\mobile-app\android\app\build\outputs\apk\release\app-release.apk
```

**Unsigned APK (keystore bo'lmasa):**
```
C:\IQMax\mobile-app\android\app\build\outputs\apk\release\app-release-unsigned.apk
```

## 🎯 4. APK O'lchamini Optimizatsiya Qilish

### Hozirgi Holat:
- ✅ ProGuard yoqilgan (minifyEnabled: true)
- ✅ Resource shrinking yoqilgan (shrinkResources: true)
- ✅ Web assets yo'q (production server ishlatiladi)

### APK O'lchami Kichik Bo'lish Sabablari:
1. **Web assets yo'q** - Ilova `https://rash.uz` dan yuklanadi
2. **Optimizatsiya yoqilgan** - ProGuard kodni kichraytiradi
3. **Unsigned** - Imzolanmagan APK biroz kichikroq

### APK O'lchamini Oshirish (agar kerak bo'lsa):

Agar local web assets qo'shmoqchi bo'lsangiz:

1. `capacitor.config.ts` da `server.url` ni o'chiring
2. `webDir: '../.next'` qo'shing
3. Next.js build qiling
4. Capacitor sync qiling

**Lekin:** Production server ishlatish professional yondashuvdir!

## 📦 5. Google Play uchun AAB (Android App Bundle)

AAB formatida yaratish (Google Play tavsiya qiladi):

```powershell
cd C:\IQMax\mobile-app
.\build-aab.ps1
```

AAB fayl:
```
C:\IQMax\mobile-app\android\app\build\outputs\bundle\release\app-release.aab
```

## 🔍 6. APK Tahlil Qilish

APK ichidagi fayllarni ko'rish:

```powershell
# APK ni ZIP sifatida ochish
Rename-Item app-release.apk app-release.zip
Expand-Archive app-release.zip -DestinationPath apk-contents
```

## ⚠️ Muhim Eslatmalar

1. **Keystore parolini** yaxshi eslab qoling va backup qiling!
2. **Version code** har safar yangilanganda oshiring
3. **Test qiling** - har bir buildni real qurilmada sinab ko'ring
4. **Production server** ishlatish professional yondashuvdir

## 📊 APK O'lchami

**Normal o'lchamlar:**
- Minimal APK: 1-3 MB (web assets yo'q)
- O'rtacha APK: 5-15 MB (local assets bilan)
- Katta APK: 20+ MB (ko'p assets bilan)

**Sizning APK:**
- 1.6 MB - Bu normal va professional!
- Web assets yo'q (production server ishlatiladi)
- ProGuard optimizatsiyasi yoqilgan
- Resource shrinking yoqilgan

---

**Tayyor!** Keystore yaratib, professional signed APK yarating! 🚀
