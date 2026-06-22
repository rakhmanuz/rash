#!/bin/bash
# Serverda loyiha papkasida ishlatish: bash scripts/server-deploy.sh
# Masalan: cd /root/rash && bash scripts/server-deploy.sh

set -e
echo "=== RASH server deploy ==="

if [ ! -f "package.json" ]; then
  echo "XATO: package.json topilmadi. Loyiha papkasida ekanligingizni tekshiring."
  echo "Masalan: cd /root/rash  yoki  cd /var/www/rash"
  exit 1
fi

echo "1. Git yangilash (lokal o'zgarishlarni bekor qilish)..."
git fetch origin
git reset --hard origin/main

echo "2. Dependencies o'rnatish..."
rm -rf node_modules
if ! npm ci; then
  echo "npm ci ishlamadi, npm install bilan davom etiladi..."
  npm install
fi

echo "3. Prisma generate (builddan oldin majburiy)..."
npx prisma generate

echo "4. PM2 to'xtatish..."
pm2 stop rash || true

echo "5. Baza yangilash (db push)..."
npx prisma db push

echo "6. Eski build o'chirish (toza build uchun)..."
rm -rf .next

echo "7. Build..."
npm run build

echo "8. PM2 to'liq qayta ishga tushirish (fork, bitta instans)..."
pm2 delete rash 2>/dev/null || true
pm2 flush rash 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save 2>/dev/null || true

echo "=== Tugadi ==="
pm2 status
echo "Agar brauzerda xato bo'lsa: Ctrl+Shift+R (kesh tozalash)"
