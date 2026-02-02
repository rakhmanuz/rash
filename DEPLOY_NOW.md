# 🚀 Serverga Yuklash - Hozir

## ⚡ Tezkor Yuklash (Barcha qadamlar birga)

Serverga SSH orqali ulaning va quyidagi buyruqlarni bajaring:

```bash
# 1. Serverga ulanish
ssh root@rash.uz

# 2. To'g'ri papkaga o'tish
cd /var/www/rash

# 3. Git'dan yangilanishlarni olish
git pull origin main

# 4. Dependencies o'rnatish
npm ci --production=false

# 5. Prisma generate
npx prisma generate

# 6. Build cache tozalash (agar kerak bo'lsa)
rm -rf .next
rm -rf node_modules/.cache

# 7. Production build
npm run build

# 8. PM2'ni to'xtatish
pm2 stop rash

# 9. PM2'ni qayta ishga tushirish (ecosystem config bilan)
pm2 start ecosystem.config.js

# 10. PM2'ni saqlash
pm2 save

# 11. Status tekshirish
pm2 status
pm2 logs rash --lines 30
```

## 📝 Qadam-baqadam Ko'rsatma

### 1. Serverga Ulanish
```bash
ssh root@rash.uz
```

### 2. Papkaga O'tish
```bash
cd /var/www/rash
```

### 3. Git Yangilanishlari
```bash
git pull origin main
```

### 4. Dependencies
```bash
npm ci --production=false
```

### 5. Prisma
```bash
npx prisma generate
```

### 6. Build
```bash
npm run build
```

### 7. PM2 Restart
```bash
pm2 restart rash
# yoki agar ishlamayotgan bo'lsa:
pm2 delete rash
pm2 start ecosystem.config.js
pm2 save
```

### 8. Tekshirish
```bash
# PM2 status
pm2 status

# Loglar
pm2 logs rash --lines 50

# Working directory tekshirish
pm2 describe rash | grep cwd
# /var/www/rash ko'rsatishi kerak
```

## ⚠️ Agar Xatolik Bo'lsa

### Build xatolik?
```bash
cd /var/www/rash
rm -rf .next
rm -rf node_modules/.cache
npm run build
```

### PM2 ishlamayapti?
```bash
cd /var/www/rash
pm2 delete rash
pm2 start ecosystem.config.js
pm2 save
pm2 status
```

### Port band?
```bash
lsof -i :3000
# Agar band bo'lsa:
kill -9 $(lsof -ti:3000)
pm2 restart rash
```

## ✅ Muvaffaqiyatli Bo'lgandan Keyin

- ✅ PM2 status `online` bo'lishi kerak
- ✅ Loglarda xatolik bo'lmasligi kerak
- ✅ https://rash.uz ishlashi kerak
- ✅ O'quvchilar sahifasida parolni ko'rsatish tugmasi ishlashi kerak

## 🔍 Tekshirish

1. **PM2 Status:**
   ```bash
   pm2 status
   ```

2. **Loglar:**
   ```bash
   pm2 logs rash --lines 50
   ```

3. **Sayt:**
   - https://rash.uz oching
   - Login qiling
   - Admin > O'quvchilar sahifasiga o'ting
   - Parolni ko'rsatish tugmasini tekshiring (binafsha rangdagi kalit ikoni)
