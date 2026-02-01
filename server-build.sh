#!/bin/bash

# Serverda build qilish uchun script

echo "=== Server Build Script ==="
echo ""

# 1. PM2'ni to'xtatish
echo "1. PM2'ni to'xtatish..."
pm2 stop rash

# 2. Eski build'ni tozalash
echo "2. Eski build'ni tozalash..."
rm -rf .next

# 3. Git'dan yangi kodlarni olish
echo "3. Git'dan yangi kodlarni olish..."
git pull

# 4. Node modules'ni o'rnatish
echo "4. Node modules'ni o'rnatish..."
npm install

# 5. Prisma generate
echo "5. Prisma generate..."
npx prisma generate

# 6. Production build qilish
echo "6. Production build qilish (bu bir necha daqiqa davom etishi mumkin)..."
npm run build

# 7. Build muvaffaqiyatli bo'lganda .next folder'ni tekshirish
if [ -d ".next" ]; then
    echo "✓ Build muvaffaqiyatli! .next folder yaratilgan."
    ls -la .next | head -10
else
    echo "✗ XATOLIK: .next folder yaratilmagan!"
    exit 1
fi

# 8. PM2'ni qayta ishga tushirish
echo "8. PM2'ni qayta ishga tushirish..."
pm2 restart rash

# 9. Statusni ko'rsatish
echo "9. PM2 status:"
pm2 status

echo ""
echo "=== Build tugadi ==="
echo "Loglarni ko'rish uchun: pm2 logs rash --lines 20"
