#!/bin/bash

# Serverda yo'qolgan fayllarni tiklash scripti
# Eslatma: Bu script serverda ishga tushiriladi

set -e

echo "=========================================="
echo "🔧 Serverda yo'qolgan fayllarni tiklash..."
echo "=========================================="

SERVER_DIR="/var/www/rash"

# 1. PM2'ni to'xtatish
echo ""
echo "📦 PM2'ni to'xtatish..."
pm2 stop rash 2>/dev/null || true
pm2 delete rash 2>/dev/null || true

# 2. Papkaga kirish
cd "$SERVER_DIR" || {
    echo "❌ Xatolik: $SERVER_DIR papkasi topilmadi!"
    echo "Papkani yaratish..."
    mkdir -p "$SERVER_DIR"
    cd "$SERVER_DIR"
}

# 3. Git holatini tekshirish
echo ""
echo "📥 Git holatini tekshirish..."
if [ -d ".git" ]; then
    echo "✅ Git repository mavjud"
    git fetch origin
    git reset --hard origin/main
    git pull origin main
else
    echo "⚠️  Git repository yo'q, clone qilinmoqda..."
    cd /var/www
    rm -rf rash
    git clone https://github.com/rakhmanuz/rash.git rash
    cd rash
fi

# 4. Fayllarni tekshirish
echo ""
echo "📋 Fayllarni tekshirish..."
if [ ! -f "package.json" ]; then
    echo "❌ package.json topilmadi! Git pull qayta bajarilmoqda..."
    git fetch origin
    git reset --hard origin/main
    git pull origin main --force
fi

# 5. Fayllar mavjudligini tasdiqlash
echo ""
echo "✅ Fayllar mavjudligini tasdiqlash..."
if [ -f "package.json" ]; then
    echo "✅ package.json mavjud"
else
    echo "❌ package.json hali ham topilmadi!"
    echo "Iltimos, qo'lda tekshiring:"
    echo "  cd /var/www/rash"
    echo "  ls -la"
    exit 1
fi

if [ -f "prisma/schema.prisma" ]; then
    echo "✅ prisma/schema.prisma mavjud"
else
    echo "⚠️  prisma/schema.prisma topilmadi"
fi

# 6. Dependencies o'rnatish
echo ""
echo "📦 Dependencies o'rnatilmoqda..."
npm install

# 7. Prisma generate
echo ""
echo "🔧 Prisma generate qilinmoqda..."
npx prisma generate

# 8. Database schema push
echo ""
echo "🗄️  Database schema push qilinmoqda..."
npx prisma db push --accept-data-loss || true

# 9. Build
echo ""
echo "🏗️  Production build qilinmoqda..."
rm -rf .next
npm run build

# 10. PM2'ni ishga tushirish
echo ""
echo "🚀 PM2 ishga tushirilmoqda..."
pm2 start npm --name "rash" -- start
pm2 save

# 11. Status
echo ""
echo "=========================================="
echo "✅ Tiklash muvaffaqiyatli yakunlandi!"
echo "=========================================="
pm2 status
echo ""
echo "📋 So'nggi loglar:"
pm2 logs rash --lines 10 --nostream
