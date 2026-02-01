#!/bin/bash

# Rash.uz serverga to'liq deployment script
# Eslatma: Bu script serverda ishga tushiriladi

set -e  # Xatolik bo'lsa, to'xtatish

echo "=========================================="
echo "🚀 Rash.uz serverga yuklash boshlandi..."
echo "=========================================="

# Server papkasi
SERVER_DIR="/var/www/rash"

# 1. Papkaga kirish
cd "$SERVER_DIR" || {
    echo "❌ Xatolik: $SERVER_DIR papkasi topilmadi!"
    exit 1
}

# 2. PM2'ni to'xtatish
echo ""
echo "📦 PM2'ni to'xtatish..."
pm2 stop rash 2>/dev/null || true

# 3. Git'dan yangilanishlarni olish
echo ""
echo "📥 Git'dan yangilanishlarni olish..."
git fetch origin
git reset --hard origin/main
git pull origin main

# 4. Database backup (agar mavjud bo'lsa)
echo ""
echo "💾 Database backup qilinmoqda..."
BACKUP_DIR="/var/www/rash-backups"
mkdir -p "$BACKUP_DIR"
if [ -f "$SERVER_DIR/prisma/dev.db" ]; then
    BACKUP_FILE="$BACKUP_DIR/dev.db.$(date +%Y%m%d_%H%M%S).backup"
    cp "$SERVER_DIR/prisma/dev.db" "$BACKUP_FILE"
    echo "✅ Database backup saqlandi: $BACKUP_FILE"
fi

# 5. Dependencies o'rnatish
echo ""
echo "📦 Dependencies o'rnatilmoqda..."
npm ci --production=false

# 6. Prisma generate
echo ""
echo "🔧 Prisma generate qilinmoqda..."
npx prisma generate

# 7. Database schema push
echo ""
echo "🗄️  Database schema push qilinmoqda..."
npx prisma db push --accept-data-loss || true

# 8. Build cache tozalash
echo ""
echo "🧹 Build cache tozalanmoqda..."
rm -rf .next
rm -rf node_modules/.cache

# 9. Production build
echo ""
echo "🏗️  Production build qilinmoqda..."
npm run build

# 10. PM2'ni ishga tushirish
echo ""
echo "🚀 PM2 ishga tushirilmoqda..."
pm2 delete rash 2>/dev/null || true
pm2 start npm --name "rash" -- start
pm2 save

# 11. Status ko'rsatish
echo ""
echo "=========================================="
echo "✅ Deployment muvaffaqiyatli yakunlandi!"
echo "=========================================="
echo ""
pm2 status
echo ""
echo "📋 So'nggi loglar:"
pm2 logs rash --lines 20 --nostream

echo ""
echo "🌐 Rash.uz: https://rash.uz"
echo ""
