# 🔧 .next Papkasi Topilmayapti - Muammoni Hal Qilish

## ❌ Muammo

PM2 xatolik ko'rsatayapti:
```
Error: Could not find a production build in the '.next' directory
ENOENT: no such file or directory, open '/var/www/rash/.next/prerender-manifest.json'
```

## ✅ Yechim

### VPS'da quyidagi komandalarni bajaring:

```bash
# 1. VPS'ga ulanish
ssh root@rash.uz

# 2. Project papkasiga o'tish
cd /var/www/rash

# 3. Eski .next papkasini tozalash (agar mavjud bo'lsa)
rm -rf .next
rm -rf node_modules/.cache

# 4. Prisma'ni yangilash
npx prisma generate

# 5. Database'ni yangilash
npx prisma db push

# 6. Production build qilish (MUHIM!)
npm run build

# 7. Build muvaffaqiyatli bo'lganini tekshirish
ls -la .next

# 8. PM2'ni restart qilish
pm2 restart rash

# 9. Loglarni tekshirish
pm2 logs rash --lines 30
```

## 🚀 Bitta Komanda (Tezkor)

```bash
cd /var/www/rash && rm -rf .next node_modules/.cache && npx prisma generate && npx prisma db push && npm run build && pm2 restart rash && pm2 logs rash --lines 20
```

## ⚠️ Agar Build Xatolik Bersa

```bash
cd /var/www/rash

# Cache tozalash
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules/.prisma

# Dependencies qayta o'rnatish
npm ci

# Prisma generate
npx prisma generate

# Build qilish
npm run build

# PM2 restart
pm2 restart rash
```

## 📋 Tekshirish

Build muvaffaqiyatli bo'lganini tekshirish:

```bash
# .next papkasi mavjudligini tekshirish
ls -la .next

# Quyidagi fayllar bo'lishi kerak:
# - BUILD_ID
# - prerender-manifest.json
# - routes-manifest.json
# - server/
# - static/
```

## ✅ Muvaffaqiyatli Build Belgilari

- `.next` papkasi mavjud
- `pm2 status` da `rash` process `online` ko'rsatadi
- `pm2 logs rash` da xatoliklar yo'q
- https://rash.uz sayt ochiladi
