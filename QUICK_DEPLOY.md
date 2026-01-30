# Tezkor Server Yuklash

## 🚀 VPS'ga Deploy Qadamlar

### 1. VPS'ga SSH orqali Ulanish

```bash
ssh root@VPS_IP
# yoki
ssh username@VPS_IP
```

### 2. VPS'da Kodni Yangilash

```bash
cd /var/www/rash
git pull
```

### 3. Dependencies O'rnatish

```bash
npm ci
```

### 4. Prisma Database Yangilash

```bash
npx prisma generate
npx prisma db push
```

### 5. Production Build

```bash
npm run build
```

### 6. PM2 Restart

```bash
pm2 restart rash
# yoki agar ishlamayotgan bo'lsa
pm2 start ecosystem.config.js --env production
pm2 save
```

### 7. Tekshirish

```bash
pm2 status
pm2 logs rash --lines 50
```

## ✅ Tezkor Komanda (Barcha qadamlar birga)

```bash
cd /var/www/rash && \
git pull && \
npm ci && \
npx prisma generate && \
npx prisma db push && \
npm run build && \
pm2 restart rash
```

## 🔧 Agar Xatolik Bo'lsa

### Build xatolik?

```bash
# Cache tozalash
rm -rf .next
rm -rf node_modules/.cache
npm run build
```

### Database xatolik?

```bash
npx prisma db push
npx prisma generate
```

### PM2 ishlamayapti?

```bash
pm2 delete rash
pm2 start ecosystem.config.js --env production
pm2 save
```

## 📝 Checklist

- [ ] Git pull muvaffaqiyatli
- [ ] npm ci muvaffaqiyatli
- [ ] Prisma generate muvaffaqiyatli
- [ ] Prisma db push muvaffaqiyatli
- [ ] Build muvaffaqiyatli
- [ ] PM2 ishlayapti
- [ ] Sayt ishlayapti (https://rash.uz)
