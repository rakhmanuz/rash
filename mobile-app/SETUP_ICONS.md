# App Icons O'rnatish

Android ilovasi uchun icon fayllarini o'rnatish.

## 📐 Icon O'lchamlari

Quyidagi o'lchamlarda icon fayllar kerak:

- **mdpi**: 48x48 px
- **hdpi**: 72x72 px
- **xhdpi**: 96x96 px
- **xxhdpi**: 144x144 px
- **xxxhdpi**: 192x192 px

## 📁 Joylashuv

Icon fayllarni quyidagi papkalarga qo'ying:

```
mobile-app/android/app/src/main/res/
├── mipmap-mdpi/
│   └── ic_launcher.png (48x48)
│   └── ic_launcher_round.png (48x48)
├── mipmap-hdpi/
│   └── ic_launcher.png (72x72)
│   └── ic_launcher_round.png (72x72)
├── mipmap-xhdpi/
│   └── ic_launcher.png (96x96)
│   └── ic_launcher_round.png (96x96)
├── mipmap-xxhdpi/
│   └── ic_launcher.png (144x144)
│   └── ic_launcher_round.png (144x144)
└── mipmap-xxxhdpi/
    └── ic_launcher.png (192x192)
    └── ic_launcher_round.png (192x192)
```

## 🎨 Icon Yaratish

### Online Tool

1. **Android Asset Studio**: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
2. **App Icon Generator**: https://www.appicon.co/
3. **Icon Kitchen**: https://icon.kitchen/

### Manual

1. Asosiy icon yarating (1024x1024 px PNG)
2. Har bir o'lcham uchun resize qiling
3. Yuqoridagi papkalarga qo'ying

## 🔄 Mavjud Iconlardan Foydalanish

Agar `public/icon-*.png` fayllar mavjud bo'lsa, ularni resize qilib foydalanish mumkin.

## ✅ Tekshirish

Iconlar to'g'ri o'rnatilganini tekshirish:

```bash
cd mobile-app/android/app/src/main/res
ls -la mipmap-*/ic_launcher.png
```

## 📱 Adaptive Icons (Ixtiyoriy)

Android 8.0+ uchun adaptive icons:

```
mobile-app/android/app/src/main/res/
└── mipmap-anydpi-v26/
    ├── ic_launcher.xml
    └── ic_launcher_round.xml
```

Adaptive icon uchun:
- **Foreground**: 108x108 dp (432x432 px xxxhdpi)
- **Background**: 108x108 dp (432x432 px xxxhdpi)

---

**Eslatma:** Iconlar o'rnatilmasa, default Android icon ko'rinadi.
