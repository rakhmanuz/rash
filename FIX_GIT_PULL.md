# 🔧 Git Pull Xatolikni Hal Qilish

## ❌ Muammo

```
error: Your local changes to the following files would be overwritten by merge:
package-lock.json
Please commit your changes or stash them before you merge.
```

## ✅ Yechim

### Variant 1: Stash qilish (Tavsiya etiladi)

VPS'da quyidagi komandalarni bajaring:

```bash
cd /var/www/rash

# Local o'zgarishlarni stash qilish
git stash

# Git pull qilish
git pull

# Stash'ni qaytarish (agar kerak bo'lsa)
# git stash pop

# Keyin build va restart
npm ci
npm run build
pm2 restart rash
```

### Variant 2: package-lock.json ni o'chirish va qayta yaratish

```bash
cd /var/www/rash

# package-lock.json ni o'chirish
rm package-lock.json

# Git pull qilish
git pull

# Dependencies'ni qayta o'rnatish (package-lock.json avtomatik yaratiladi)
npm ci

# Build va restart
npm run build
pm2 restart rash
```

### Variant 3: Force pull (Agar stash ishlamasa)

```bash
cd /var/www/rash

# Local o'zgarishlarni bekor qilish
git reset --hard HEAD

# Git pull qilish
git pull

# Dependencies va build
npm ci
npm run build
pm2 restart rash
```

## 🚀 Tezkor Komanda (Variant 2 - Eng oson)

```bash
cd /var/www/rash && rm package-lock.json && git pull && npm ci && npm run build && pm2 restart rash
```

## ⚠️ Eslatma

`package-lock.json` fayli avtomatik yaratiladi `npm ci` yoki `npm install` qilganda. Uni o'chirish xavfsiz.

## 📝 Keyingi Safar

Har safar yangilashda:

```bash
cd /var/www/rash && git pull && npm ci && npm run build && pm2 restart rash
```

Agar yana xatolik bo'lsa, yuqoridagi Variant 2 ni ishlating.
