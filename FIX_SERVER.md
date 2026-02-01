# Server Muammosini Hal Qilish

## Muammo:
PM2 loglarida `.next` folder topilmayapti. Bu sababli application ishlamayapti.

## Yechim - Qadam-baqadam:

### 1. Serverga SSH orqali kirish:
```bash
ssh root@rash.uz
```

### 2. Project folder'ga o'tish:
```bash
cd /var/www/rash
```

### 3. PM2'ni to'xtatish (build qilish uchun):
```bash
pm2 stop rash
```

### 4. Eski build'ni tozalash:
```bash
rm -rf .next
```

### 5. Git'dan yangi kodlarni olish:
```bash
git pull
```

### 6. Node modules'ni tekshirish va o'rnatish (agar kerak bo'lsa):
```bash
npm install
```

### 7. Prisma generate qilish:
```bash
npx prisma generate
```

### 8. **MUHIM: Production build qilish:**
```bash
npm run build
```

Bu buyruq bir necha daqiqa davom etishi mumkin. Oxirida quyidagilar ko'rinishi kerak:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

### 9. Build muvaffaqiyatli bo'lgandan keyin, .next folder mavjudligini tekshirish:
```bash
ls -la .next
```

Bu buyruq `.next` folder'ni va ichidagi fayllarni ko'rsatishi kerak.

### 10. PM2'ni qayta ishga tushirish:
```bash
pm2 restart rash
```

### 11. Statusni tekshirish:
```bash
pm2 status
```

### 12. Loglarni tekshirish (xatolik bo'lmasligi kerak):
```bash
pm2 logs rash --lines 20
```

## Agar build xatolik bersa:

### A) Memory muammosi bo'lsa:
```bash
# Swap memory qo'shish
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### B) Node modules muammosi bo'lsa:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### C) Prisma muammosi bo'lsa:
```bash
npx prisma generate
npx prisma db push
npm run build
```

## Build muvaffaqiyatli bo'lgandan keyin:

1. `.next` folder yaratilgan bo'lishi kerak
2. `prerender-manifest.json` fayli mavjud bo'lishi kerak
3. PM2'da status `online` bo'lishi kerak
4. Sayt `https://rash.uz` da ishlashi kerak

## Tekshirish:

```bash
# .next folder'ni tekshirish
ls -la .next/prerender-manifest.json

# PM2 status
pm2 status

# Browser'dan saytni ochish
# https://rash.uz
```
