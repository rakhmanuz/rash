#!/bin/bash

# Serverni qayta ishga tushirish uchun script

echo "=== Serverni Qayta Ishga Tushirish ==="
echo ""

# 1. PM2'ni to'xtatish
echo "1. PM2'ni to'xtatish..."
pm2 stop rash || true

# 2. PM2'ni o'chirish (agar mavjud bo'lsa)
echo "2. PM2'ni o'chirish..."
pm2 delete rash || true

# 3. Port 3000'ni tekshirish va bo'shatish
echo "3. Port 3000'ni tekshirish..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
echo "✓ Port 3000 bo'shatildi"

# 4. Project folder'ga o'tish
cd /var/www/rash || exit 1

# 5. Git'dan yangi kodlarni olish
echo ""
echo "4. Git'dan yangi kodlarni olish..."
git pull origin main || {
    echo "⚠ Git pull xatolik berdi, lekin davom etamiz..."
}

# 6. Eski build'ni tozalash
echo ""
echo "5. Eski build'ni tozalash..."
rm -rf .next
rm -rf node_modules/.cache
echo "✓ Build tozalandi"

# 7. Node modules'ni o'rnatish
echo ""
echo "6. Node modules'ni o'rnatish..."
npm install
echo "✓ Node modules o'rnatildi"

# 8. Prisma generate
echo ""
echo "7. Prisma generate..."
npx prisma generate
echo "✓ Prisma generate qilindi"

# 9. Environment variables'ni tekshirish
echo ""
echo "8. Environment variables'ni tekshirish..."
if [ ! -f ".env.local" ]; then
    echo "⚠ .env.local fayli yo'q - yaratilmoqda..."
    SECRET=$(openssl rand -base64 32)
    cat > .env.local << EOF
NEXTAUTH_URL=https://rash.uz
NEXTAUTH_SECRET=$SECRET
NODE_ENV=production
DATABASE_URL="file:./dev.db"
EOF
    echo "✓ .env.local yaratildi"
else
    echo "✓ .env.local mavjud"
    # NEXTAUTH_URL'ni tekshirish
    if ! grep -q "NEXTAUTH_URL" .env.local; then
        echo "⚠ NEXTAUTH_URL qo'shilmoqda..."
        echo "NEXTAUTH_URL=https://rash.uz" >> .env.local
    fi
    # NEXTAUTH_SECRET'ni tekshirish
    if ! grep -q "NEXTAUTH_SECRET" .env.local; then
        echo "⚠ NEXTAUTH_SECRET qo'shilmoqda..."
        SECRET=$(openssl rand -base64 32)
        echo "NEXTAUTH_SECRET=$SECRET" >> .env.local
    fi
fi

# 10. Production build qilish
echo ""
echo "9. Production build qilish (bu bir necha daqiqa davom etishi mumkin)..."
npm run build

# 11. Build muvaffaqiyatli bo'lganda tekshirish
if [ -d ".next" ]; then
    echo "✓ Build muvaffaqiyatli! .next folder yaratilgan."
else
    echo "✗ XATOLIK: .next folder yaratilmagan!"
    exit 1
fi

# 12. Logs folder'ni yaratish
echo ""
echo "10. Logs folder'ni yaratish..."
mkdir -p logs
echo "✓ Logs folder yaratildi"

# 13. PM2'ni qayta ishga tushirish
echo ""
echo "11. PM2'ni qayta ishga tushirish..."
pm2 start ecosystem.config.js --env production
pm2 save
echo "✓ PM2 ishga tushirildi"

# 14. Bir oz kutish (application ishga tushish uchun)
sleep 3

# 15. Statusni ko'rsatish
echo ""
echo "12. PM2 status:"
pm2 status

# 16. Port 3000'ni tekshirish
echo ""
echo "13. Port 3000'ni tekshirish..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✓ Port 3000'da application ishlayapti"
else
    echo "⚠ Port 3000'da application ishlamayapti"
fi

# 17. Loglarni ko'rsatish (oxirgi 15 qator)
echo ""
echo "14. Oxirgi loglar:"
pm2 logs rash --lines 15 --nostream

echo ""
echo "=== Server Qayta Ishga Tushirildi ==="
echo ""
echo "Tekshirish:"
echo "1. PM2 status: pm2 status"
echo "2. Loglar: pm2 logs rash"
echo "3. Port: lsof -i :3000"
echo "4. Sayt: https://rash.uz"
echo ""
