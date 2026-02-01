# ⚡ Serverda Tezkor Tuzatish

Agar script topilmasa, quyidagi buyruqlarni ketma-ket bajaring:

## 🔧 Qadam 1: Git Pull (MUHIM!)

```bash
cd /var/www/rash

# Git holatini tekshirish
git status

# Agar git repository mavjud bo'lsa
git fetch origin
git reset --hard origin/main
git pull origin main

# Agar git repository yo'q bo'lsa
cd /var/www
rm -rf rash
git clone https://github.com/rakhmanuz/rash.git rash
cd rash
```

## 🔧 Qadam 2: Fayllarni Tekshirish

```bash
# Fayllar mavjudligini tekshirish
ls -la
ls -la scripts/

# package.json mavjudligini tekshirish
cat package.json
```

## 🔧 Qadam 3: PM2'ni To'xtatish

```bash
pm2 stop rash
pm2 delete rash
```

## 🔧 Qadam 4: Dependencies va Build

```bash
cd /var/www/rash

# Dependencies
npm install

# Prisma
npx prisma generate
npx prisma db push

# Build
npm run build
```

## 🔧 Qadam 5: PM2 Ishga Tushirish

```bash
pm2 start npm --name "rash" -- start
pm2 save
```

## 🔧 Qadam 6: Tekshirish

```bash
pm2 status
pm2 logs rash --lines 50
```

## 🚨 Agar Hech Narsa Ishlamasa

```bash
# To'liq qayta o'rnatish
cd /var/www
pm2 stop all
pm2 delete all

# Database backup
mkdir -p /var/www/rash-backups
cp -r rash/prisma/dev.db /var/www/rash-backups/dev.db.backup 2>/dev/null || true

# Eski papkani o'chirish
rm -rf rash

# Yangi clone
git clone https://github.com/rakhmanuz/rash.git rash
cd rash

# Environment variables
nano .env.local
# Quyidagilarni qo'shing:
# DATABASE_URL="file:./prisma/dev.db"
# NEXTAUTH_SECRET="your-secret-key"
# NEXTAUTH_URL="https://rash.uz"

# O'rnatish
npm install
npx prisma generate
npx prisma db push
npm run build

# PM2
pm2 start npm --name "rash" -- start
pm2 save
pm2 startup
```
