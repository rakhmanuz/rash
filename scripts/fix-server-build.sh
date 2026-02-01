#!/bin/bash

# Serverda CSS/JS muammosini tuzatish scripti

set -e

echo "🔧 Server build muammosini tuzatish..."

cd /var/www/rash || exit 1

# 1. PM2 to'xtatish
echo "⏸️  PM2 to'xtatilmoqda..."
pm2 stop rash || true
pm2 delete rash || true

# 2. Eski build va cache tozalash
echo "🧹 Eski build va cache tozalanmoqda..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .cache

# 3. Git yangilash
echo "📥 Git yangilanmoqda..."
git fetch origin
git reset --hard origin/main
git clean -fd

# 4. Dependencies yangilash
echo "📦 Dependencies yangilanmoqda..."
npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# 5. Prisma generate
echo "🗄️  Prisma generate qilinmoqda..."
npx prisma generate

# 6. Database push (agar kerak bo'lsa)
echo "🗄️  Database push qilinmoqda..."
npx prisma db push --skip-generate || true

# 7. Build qilish
echo "🏗️  Build qilinmoqda..."
NODE_ENV=production npm run build

# 8. Build tekshirish
if [ ! -d ".next" ]; then
    echo "❌ Build muvaffaqiyatsiz! .next papkasi topilmadi."
    exit 1
fi

if [ ! -f ".next/static" ]; then
    echo "⚠️  Static fayllar topilmadi, qayta build qilinmoqda..."
    npm run build
fi

# 9. PM2 qayta ishga tushirish
echo "🚀 PM2 qayta ishga tushirilmoqda..."
pm2 start ecosystem.config.js
pm2 save

# 10. Status tekshirish
echo "✅ Status tekshirilmoqda..."
pm2 status
pm2 logs rash --lines 20

echo ""
echo "✅ Barcha amallar muvaffaqiyatli bajarildi!"
echo "🌐 Sayt: https://rash.uz"
echo ""
echo "Agar muammo davom etsa, quyidagilarni tekshiring:"
echo "1. Nginx konfiguratsiyasi: /etc/nginx/sites-available/rash.uz"
echo "2. PM2 loglar: pm2 logs rash"
echo "3. Browser console: F12 > Console"
