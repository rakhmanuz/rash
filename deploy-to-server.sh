#!/bin/bash

# Serverga to'liq deploy qilish uchun script

echo "=== Serverga Deploy Qilish ==="
echo ""

# 1. PM2'ni to'xtatish
echo "1. PM2'ni to'xtatish..."
pm2 stop rash || true

# 2. Eski build'ni tozalash
echo "2. Eski build'ni tozalash..."
rm -rf .next
rm -rf node_modules/.cache

# 3. Git'dan yangi kodlarni olish
echo "3. Git'dan yangi kodlarni olish..."
git pull origin main

# 4. Node modules'ni o'rnatish
echo "4. Node modules'ni o'rnatish..."
npm install

# 5. Prisma generate
echo "5. Prisma generate..."
npx prisma generate

# 6. Database migration (agar kerak bo'lsa)
echo "6. Database migration..."
npx prisma db push --skip-generate || true

# 7. Production build qilish
echo "7. Production build qilish (bu bir necha daqiqa davom etishi mumkin)..."
npm run build

# 8. Build muvaffaqiyatli bo'lganda .next folder'ni tekshirish
if [ -d ".next" ]; then
    echo "✓ Build muvaffaqiyatli! .next folder yaratilgan."
    echo "✓ Build fayllari:"
    ls -la .next | head -5
else
    echo "✗ XATOLIK: .next folder yaratilmagan!"
    exit 1
fi

# 9. Environment variables'ni tekshirish
echo ""
echo "9. Environment variables'ni tekshirish..."
if [ -f ".env.local" ]; then
    echo "✓ .env.local fayli mavjud"
    if grep -q "NEXTAUTH_URL" .env.local; then
        echo "✓ NEXTAUTH_URL sozlangan"
    else
        echo "⚠ NEXTAUTH_URL sozlanmagan - qo'shing: NEXTAUTH_URL=https://rash.uz"
    fi
    if grep -q "NEXTAUTH_SECRET" .env.local; then
        echo "✓ NEXTAUTH_SECRET sozlangan"
    else
        echo "⚠ NEXTAUTH_SECRET sozlanmagan - qo'shing: NEXTAUTH_SECRET=<secret-key>"
    fi
else
    echo "⚠ .env.local fayli yo'q - yaratish kerak!"
fi

# 10. PM2'ni qayta ishga tushirish
echo ""
echo "10. PM2'ni qayta ishga tushirish..."
pm2 restart rash || pm2 start ecosystem.config.js --env production

# 11. Statusni ko'rsatish
echo ""
echo "11. PM2 status:"
pm2 status

# 12. Loglarni ko'rsatish (oxirgi 10 qator)
echo ""
echo "12. Oxirgi loglar:"
pm2 logs rash --lines 10 --nostream

echo ""
echo "=== Deploy tugadi ==="
echo ""
echo "Tekshirish:"
echo "1. PM2 status: pm2 status"
echo "2. Loglar: pm2 logs rash"
echo "3. Sayt: https://rash.uz"
echo ""
