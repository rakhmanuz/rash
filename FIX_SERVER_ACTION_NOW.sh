#!/bin/bash

# Server Action xatoliklarini to'liq tuzatish

echo "🔧 Server Action xatoliklarini tuzatish..."
echo ""

cd /var/www/rash || exit 1

# 1. PM2 to'xtatish
echo "1️⃣ PM2 to'xtatish..."
pm2 stop rash
sleep 2

# 2. To'liq cache tozalash
echo "2️⃣ To'liq cache tozalash..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf out
rm -rf dist
rm -rf .next/cache
rm -rf .swc
find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name ".swc" -exec rm -rf {} + 2>/dev/null || true
echo "✅ Cache tozalandi"
echo ""

# 3. Git pull
echo "3️⃣ Git yangilash..."
git pull origin main
echo ""

# 4. Dependencies
echo "4️⃣ Dependencies o'rnatish..."
npm ci --production=false
echo ""

# 5. Prisma Generate
echo "5️⃣ Prisma Generate..."
npx prisma generate
echo ""

# 6. Build
echo "6️⃣ Build qilish..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build muvaffaqiyatli"
else
    echo "❌ Build xatolik"
    exit 1
fi
echo ""

# 7. PM2 restart
echo "7️⃣ PM2 restart..."
pm2 delete rash 2>/dev/null
pm2 start ecosystem.config.js
pm2 save
sleep 3

# 8. Status
echo "8️⃣ PM2 Status:"
pm2 status
echo ""

echo "✅ Tuzatish yakunlandi!"
echo "Loglarni tekshiring: pm2 logs rash --lines 20"
