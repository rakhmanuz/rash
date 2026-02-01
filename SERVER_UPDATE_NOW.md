# 🚀 Serverga Yangilash - Tezkor Ko'rsatma

## Serverda Quyidagi Buyruqlarni Bajaring:

```bash
# 1. Serverga SSH orqali ulanish
ssh root@rash.uz
# yoki
ssh username@rash.uz

# 2. Papkaga kirish
cd /var/www/rash

# 3. PM2'ni to'xtatish
pm2 stop rash

# 4. Git yangilash
git fetch origin
git reset --hard origin/main
git pull origin main

# 5. Dependencies (agar kerak bo'lsa)
npm install

# 6. Prisma generate
npx prisma generate

# 7. Database schema push (agar o'zgarish bo'lsa)
npx prisma db push

# 8. Build
rm -rf .next
npm run build

# 9. PM2 restart
pm2 restart rash
pm2 save

# 10. Tekshirish
pm2 status
pm2 logs rash --lines 50
```

## ⚡ Tezkor Komanda (Barcha Qadamlar Birga):

```bash
cd /var/www/rash && \
pm2 stop rash && \
git fetch origin && \
git reset --hard origin/main && \
git pull origin main && \
npm install && \
npx prisma generate && \
npx prisma db push && \
rm -rf .next && \
npm run build && \
pm2 restart rash && \
pm2 save && \
pm2 status
```

## 🔍 Tekshirish:

```bash
# PM2 status
pm2 status

# Loglar
pm2 logs rash --lines 50

# Port tekshirish
netstat -tulpn | grep 3000
```

## ✅ Muvaffaqiyatli bo'lsa:

- PM2 status: `online` ko'rsatishi kerak
- Loglar: xatolik bo'lmasligi kerak
- Sayt: https://rash.uz ishlashi kerak
