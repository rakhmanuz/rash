# APK Icon Yaratish - To'liq Qo'llanma

## 🎨 Icon Yaratish Usullari

### 1. Online Tool (Tavsiya etiladi)

**Android Asset Studio:**
- Veb-sayt: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
- Asosiy icon yuklang (1024x1024 px PNG)
- Barcha o'lchamlarda avtomatik yaratadi
- Download qiling va mipmap papkalariga qo'ying

**App Icon Generator:**
- Veb-sayt: https://www.appicon.co/
- Icon yuklang yoki yarating
- Android uchun export qiling

**Icon Kitchen:**
- Veb-sayt: https://icon.kitchen/
- Icon yuklang
- Android o'lchamlari bilan export qiling

### 2. Manual Yaratish

Asosiy icon yarating (1024x1024 px PNG), keyin quyidagi o'lchamlarda resize qiling:

- **mdpi**: 48x48 px
- **hdpi**: 72x72 px
- **xhdpi**: 96x96 px
- **xxhdpi**: 144x144 px
- **xxxhdpi**: 192x192 px

## 📁 Icon Fayllarini Joylashtirish

Icon fayllarni quyidagi papkalarga qo'ying:

```
mobile-app/android/app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png (48x48)
│   └── ic_launcher_round.png (48x48)
├── mipmap-hdpi/
│   ├── ic_launcher.png (72x72)
│   └── ic_launcher_round.png (72x72)
├── mipmap-xhdpi/
│   ├── ic_launcher.png (96x96)
│   └── ic_launcher_round.png (96x96)
├── mipmap-xxhdpi/
│   ├── ic_launcher.png (144x144)
│   └── ic_launcher_round.png (144x144)
└── mipmap-xxxhdpi/
    ├── ic_launcher.png (192x192)
    └── ic_launcher_round.png (192x192)
```

## 🔧 AndroidManifest.xml ni Yangilash

Icon fayllar qo'shilgandan keyin, `AndroidManifest.xml` ni yangilang:

```xml
<application
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    ...>
```

## 🎯 Tezkor Yechim

Agar sizda icon rasm bor bo'lsa:

1. **1024x1024 px PNG** yarating yoki mavjud iconni resize qiling
2. **Android Asset Studio** ga yuklang: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
3. **Download** qiling
4. **ZIP faylni ochib**, `res` papkasidagi barcha fayllarni `mobile-app/android/app/src/main/res/` ga ko'chiring
5. **AndroidManifest.xml** ni yangilang (yuqoridagi kod)
6. **Qayta build qiling**

## ✅ Tekshirish

Iconlar to'g'ri o'rnatilganini tekshirish:

```powershell
cd C:\IQMax\mobile-app\android\app\src\main\res
Get-ChildItem mipmap-*/ic_launcher.png
```

## 📝 Eslatmalar

- Icon fayllar **PNG** formatida bo'lishi kerak
- **Transparent background** ishlatish mumkin
- **Round icon** (yumaloq) ixtiyoriy, lekin tavsiya etiladi
- Icon o'lchamlari **aniq** bo'lishi kerak (masalan, 48x48, 72x72, va hokazo)

---

**Tayyor!** Icon qo'shilgandan keyin professional APK yaratiladi! 🎨
