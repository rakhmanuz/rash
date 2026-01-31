# 🔧 Build Xatolikni Hal Qilish

## ❌ Muammo

```
Error: Could not find a production build in the '.next' directory
Error: ENOENT: no such file or directory, open '/var/www/rash/.next/prerender-manifest.json'
```

## ✅ Yechim

### VPS'da quyidagi komandalarni bajaring:

```bash
# 1. VPS'ga ulanish
ssh root@rash.uz

# 2. Loyiha papkasiga o'tish
cd /var/www/rash

# 3. Eski build'ni tozalash (agar mavjud bo'lsa)
rm -rf .next
rm -rf node_modules/.cache

# 4. Prisma'ni yangilash
npx prisma generate

# 5. Production build qilish
npm run build

# 6. Build muvaffaqiyatli bo'lganini tekshirish
ls -la .next

# 7. PM2'ni restart qilish
pm2 restart rash

# 8. Loglarni tekshirish
pm2 logs rash --lines 50
```

## 🚀 Tezkor Komanda (Bitta qatorda)

```bash
cd /var/www/rash && rm -rf .next node_modules/.cache && npx prisma generate && npm run build && pm2 restart rash && pm2 logs rash --lines 30
```

## 🔍 Tekshirish

Build muvaffaqiyatli bo'lgandan keyin:

```bash
# .next papkasini tekshirish
ls -la .next

# PM2 holatini ko'rish
pm2 status

# Saytni tekshirish
curl http://localhost:3000
```

## ⚠️ Agar Hali Ham Xatolik Bo'lsa

### 1. To'liq qayta o'rnatish

```bash
cd /var/www/rash

# Barcha cache'ni tozalash
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules

# Dependencies'ni qayta o'rnatish
npm ci

# Prisma'ni yangilash
npx prisma generate
npx prisma db push

# Build qilish
npm run build

# PM2'ni to'liq qayta ishga tushirish
pm2 delete rash
pm2 start ecosystem.config.js --env production
pm2 save
```

### 2. Papka huquqlarini tekshirish

```bash
cd /var/www/rash

# Papka egasini tekshirish
ls -la

# Agar kerak bo'lsa, huquqlarni o'zgartirish
sudo chown -R $USER:$USER /var/www/rash
```

### 3. Environment variables tekshirish

```bash
cd /var/www/rash

# .env faylini tekshirish
cat .env

# Agar yo'q bo'lsa, yaratish
nano .env
```

`.env` ichiga:
```env
DATABASE_URL="file:./prisma/production.db"
NEXTAUTH_URL="https://rash.uz"
NEXTAUTH_SECRET="your-secret-key"
NODE_ENV="production"
PORT=3000
```

## 📝 Checklist

- [ ] `.next` papkasi tozalandi
- [ ] `npm run build` muvaffaqiyatli
- [ ] `.next` papkasi yaratilgan va fayllar mavjud
- [ ] PM2 restart qilingan
- [ ] PM2 loglarida xatolik yo'q
- [ ] Sayt ishlayapti
