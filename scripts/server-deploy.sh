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

echo "1. Git pull..."
git pull

echo "2. npm ci..."
npm ci

echo "3. Prisma generate..."
npx prisma generate

echo "4. PM2 to'xtatish..."
pm2 stop rash || true

echo "5. Baza yangilash (db push)..."
npx prisma db push

echo "6. Build..."
npm run build

echo "7. PM2 qayta ishga tushirish..."
pm2 start ecosystem.config.js --env production || pm2 restart rash

echo "=== Tugadi ==="
pm2 status
