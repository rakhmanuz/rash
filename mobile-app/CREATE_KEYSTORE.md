# Keystore Yaratish - Google Play uchun

Google Play Store-ga ilovani yuklash uchun keystore fayl yaratish kerak.

## Windows (PowerShell)

```powershell
cd mobile-app\android\app
keytool -genkey -v -keystore release.keystore -alias rash-release -keyalg RSA -keysize 2048 -validity 10000
```

## Linux/Mac

```bash
cd mobile-app/android/app
keytool -genkey -v -keystore release.keystore -alias rash-release -keyalg RSA -keysize 2048 -validity 10000
```

## So'raladigan ma'lumotlar

1. **Keystore password** - Parol (eslab qoling!)
2. **Re-enter password** - Parolni takrorlang
3. **First and last name** - Ismingiz yoki kompaniya nomi
4. **Organizational Unit** - Bo'lim (ixtiyoriy)
5. **Organization** - Tashkilot nomi (masalan: rash.uz)
6. **City** - Shahar
7. **State** - Viloyat
8. **Country code** - Mamlakat kodi (masalan: UZ)

## Muhim eslatmalar

⚠️ **Keystore parolini va alias parolini yaxshi eslab qoling!**

⚠️ **Keystore faylini xavfsiz joyda saqlang va backup qiling!**

⚠️ **Agar keystore yo'qolsa, Google Play-da yangi versiya yuklab bo'lmaydi!**

## Environment Variables

Parollarni environment variable sifatida ishlatish:

### Windows (PowerShell)

```powershell
$env:KEYSTORE_PASSWORD="your-keystore-password"
$env:KEYSTORE_ALIAS_PASSWORD="your-alias-password"
```

### Linux/Mac

```bash
export KEYSTORE_PASSWORD="your-keystore-password"
export KEYSTORE_ALIAS_PASSWORD="your-alias-password"
```

Yoki `.env` fayl yaratish (lekin gitga commit qilmang!):

```
KEYSTORE_PASSWORD=your-keystore-password
KEYSTORE_ALIAS_PASSWORD=your-alias-password
```

## Google Play App Signing

Agar Google Play Console-da "App Signing" yoqilgan bo'lsa, upload key yaratish:

```bash
keytool -genkey -v -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Bu key faqat Google Play-ga yuklash uchun ishlatiladi. Asosiy signing key Google tomonidan boshqariladi.
