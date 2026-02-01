#!/bin/bash

# Serverdan barcha fayllarni o'chirib, saytni qayta yuklash uchun script

echo "=== Serverdan To'liq O'chirib Qayta Yuklash ==="
echo ""
echo "⚠ EHTIYOT: Bu script barcha fayllarni o'chiradi!"
echo "Database (dev.db) saqlanadi, lekin boshqa hamma narsa o'chadi."
echo ""
read -p "Davom etishni xohlaysizmi? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Bekor qilindi."
    exit 1
fi

# 1. PM2'ni to'xtatish va o'chirish
echo ""
echo "1. PM2'ni to'xtatish va o'chirish..."
pm2 stop rash || true
pm2 delete rash || true

# 2. Database'ni backup qilish (agar mavjud bo'lsa)
echo ""
echo "2. Database'ni backup qilish..."
if [ -f "dev.db" ]; then
    cp dev.db dev.db.backup.$(date +%Y%m%d_%H%M%S)
    echo "✓ Database backup yaratildi: dev.db.backup.*"
else
    echo "⚠ Database fayli topilmadi"
fi

# 3. Barcha fayllarni o'chirish (database va backup'lardan tashqari)
echo ""
echo "3. Barcha fayllarni o'chirish..."
cd /var/www/rash
find . -mindepth 1 -maxdepth 1 ! -name 'dev.db*' ! -name '*.backup.*' -exec rm -rf {} +
echo "✓ Barcha fayllar o'chirildi (database saqlandi)"

# 4. Git'dan yangi kodlarni clone qilish
echo ""
echo "4. Git'dan yangi kodlarni clone qilish..."
git clone https://github.com/rakhmanuz/rash.git temp_rash
mv temp_rash/* temp_rash/.* . 2>/dev/null || true
rmdir temp_rash
echo "✓ Kodlar yuklandi"

# 5. Node modules'ni o'rnatish
echo ""
echo "5. Node modules'ni o'rnatish..."
npm install
echo "✓ Node modules o'rnatildi"

# 6. Prisma generate
echo ""
echo "6. Prisma generate..."
npx prisma generate
echo "✓ Prisma generate qilindi"

# 7. Database migration (agar kerak bo'lsa)
echo ""
echo "7. Database migration..."
npx prisma db push --skip-generate || true
echo "✓ Database migration qilindi"

# 8. Environment variables'ni yaratish/yangilash
echo ""
echo "8. Environment variables'ni sozlash..."
if [ ! -f ".env.local" ]; then
    echo "⚠ .env.local fayli yo'q - yaratish kerak!"
    echo ""
    echo "Quyidagilarni qo'shing:"
    echo "NEXTAUTH_URL=https://rash.uz"
    echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
    echo "NODE_ENV=production"
    echo "DATABASE_URL=\"file:./dev.db\""
    echo ""
    read -p "Environment variables'ni avtomatik yaratishni xohlaysizmi? (yes/no): " create_env
    
    if [ "$create_env" == "yes" ]; then
        SECRET=$(openssl rand -base64 32)
        cat > .env.local << EOF
NEXTAUTH_URL=https://rash.uz
NEXTAUTH_SECRET=$SECRET
NODE_ENV=production
DATABASE_URL="file:./dev.db"
EOF
        echo "✓ .env.local yaratildi"
    fi
else
    echo "✓ .env.local mavjud"
fi

# 9. Production build qilish
echo ""
echo "9. Production build qilish (bu bir necha daqiqa davom etishi mumkin)..."
npm run build

# 10. Build muvaffaqiyatli bo'lganda tekshirish
if [ -d ".next" ]; then
    echo "✓ Build muvaffaqiyatli! .next folder yaratilgan."
else
    echo "✗ XATOLIK: .next folder yaratilmagan!"
    exit 1
fi

# 11. Logs folder'ni yaratish
echo ""
echo "11. Logs folder'ni yaratish..."
mkdir -p logs
echo "✓ Logs folder yaratildi"

# 12. PM2'ni qayta ishga tushirish
echo ""
echo "12. PM2'ni qayta ishga tushirish..."
pm2 start ecosystem.config.js --env production
pm2 save
echo "✓ PM2 ishga tushirildi"

# 13. Statusni ko'rsatish
echo ""
echo "13. PM2 status:"
pm2 status

# 14. Loglarni ko'rsatish (oxirgi 10 qator)
echo ""
echo "14. Oxirgi loglar:"
pm2 logs rash --lines 10 --nostream

echo ""
echo "=== Qayta Yuklash Tugadi ==="
echo ""
echo "Tekshirish:"
echo "1. PM2 status: pm2 status"
echo "2. Loglar: pm2 logs rash"
echo "3. Sayt: https://rash.uz"
echo ""
