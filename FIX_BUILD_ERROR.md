# Build Xatolikni Tuzatish

## Muammo
PM2 loglarida ko'rsatilgan xatolik:
- "Could not find a production build in the '.next' directory"
- "ENOENT: no such file or directory, open '/var/www/rash/.next/prerender-manifest.json'"

## Yechim

### 1. PM2 ni to'xtatish
```bash
pm2 stop rash
# yoki
pm2 delete rash
```

### 2. .next papkasini tozalash
```bash
cd /var/www/rash
rm -rf .next
rm -rf node_modules/.cache
```

### 3. Qayta build qilish
```bash
npm run build
```

### 4. Build muvaffaqiyatli bo'lsa, PM2 ni qayta ishga tushirish
```bash
pm2 start ecosystem.config.js --env production
# yoki
pm2 restart rash
```

### 5. Status tekshirish
```bash
pm2 status
pm2 logs rash --lines 50
```

## To'liq Komanda (Bitta qatorda)

```bash
cd /var/www/rash && \
pm2 stop rash && \
rm -rf .next node_modules/.cache && \
npm run build && \
pm2 start ecosystem.config.js --env production && \
pm2 save
```

## Agar Build Xatolik Bo'lsa

### TypeScript xatolik?
```bash
npm run build 2>&1 | tee build-error.log
```

### Dependencies muammosi?
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Prisma muammosi?
```bash
npx prisma generate
npx prisma db push
npm run build
```
