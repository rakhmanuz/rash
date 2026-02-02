# ✅ PM2 Final Fix - Yangi Konfiguratsiyani Qo'llash

## 📊 Hozirgi Holat

Loglardan ko'rinib turibdiki:
- ✅ Next.js muvaffaqiyatli ishga tushgan ("✓ Ready in 825ms")
- ⚠️ Lekin hali ham eski konfiguratsiya ishlatilmoqda (npm orqali)
- ⚠️ Eski xatoliklar log faylida qolgan (tarixiy)

## ✅ To'liq Tuzatish

Serverga SSH orqali ulaning va quyidagi buyruqlarni bajaring:

```bash
# 1. Serverga SSH orqali ulaning
ssh root@rash.uz

# 2. PM2'ni to'liq o'chirish
pm2 delete rash

# 3. To'g'ri papkaga o'tish
cd /var/www/rash

# 4. Git'dan yangilanishlarni olish (YANGI konfiguratsiyani olish uchun)
git pull origin main

# 5. ecosystem.config.js tekshirish
cat ecosystem.config.js
# Quyidagicha bo'lishi kerak:
# script: 'node_modules/next/dist/bin/next'
# args: 'start'
# cwd: '/var/www/rash'

# 6. PM2'ni yangi konfiguratsiya bilan ishga tushirish
pm2 start ecosystem.config.js

# 7. PM2'ni saqlash
pm2 save

# 8. Status tekshirish
pm2 status

# 9. Loglar tekshirish (YANGI loglar)
pm2 logs rash --lines 30 --nostream
```

## 🔍 Tekshirish

### 1. PM2 Process Ma'lumotlari

```bash
# Working directory
pm2 describe rash | grep cwd
# Natija: /var/www/rash bo'lishi kerak

# Script
pm2 describe rash | grep script
# Natija: node_modules/next/dist/bin/next (npm emas!)

# Arguments
pm2 describe rash | grep args
# Natija: start (--cwd yo'q)
```

### 2. Loglar Tekshirish

```bash
# Yangi loglar (eski xatoliklar bo'lmasligi kerak)
pm2 logs rash --lines 30 --nostream

# Faqat error loglar
pm2 logs rash --err --lines 20 --nostream
# Xatoliklar bo'lmasligi kerak

# Faqat output loglar
pm2 logs rash --out --lines 20 --nostream
# "✓ Ready" ko'rinishi kerak
```

## ✅ Muvaffaqiyatli Bo'lgandan Keyin

Yangi loglarda quyidagilar ko'rinishi kerak:

```
▲ Next.js 14.2.35
- Local:        http://localhost:3000

✓ Starting...
✓ Ready in XXXms
```

**Eslatma:** Eski xatoliklar (`npm error`, `error: unknown option '--cwd'`) log faylida qolgan bo'lishi mumkin, lekin yangi loglarda ular bo'lmasligi kerak.

## 🚨 Agar Hali Ham Xatolik Bo'lsa

### To'liq Qayta O'rnatish

```bash
# 1. PM2'ni to'liq o'chirish
pm2 delete rash
pm2 kill

# 2. Papkaga o'tish
cd /var/www/rash

# 3. Git pull
git pull origin main

# 4. Dependencies
npm ci --production=false

# 5. Prisma
npx prisma generate

# 6. Build
npm run build

# 7. PM2'ni ishga tushirish
pm2 start ecosystem.config.js
pm2 save

# 8. Tekshirish
pm2 status
pm2 logs rash --lines 50 --nostream
```

## 📝 Eslatma

- **Eski loglar** - tarixiy xatoliklar log faylida qolgan bo'lishi mumkin
- **Yangi loglar** - `pm2 logs rash --nostream` bilan ko'ring
- **npm ishlatilmaydi** - endi to'g'ridan-to'g'ri Next.js bilan ishga tushiriladi
- **--cwd yo'q** - PM2 `cwd` parametridan foydalanadi
