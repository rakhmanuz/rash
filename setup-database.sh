#!/bin/bash

# Database'ni yaratish va sozlash uchun script

echo "=== Database Yaratish va Sozlash ==="
echo ""

# 1. Project folder'ga o'tish
cd /var/www/rash || exit 1

# 2. Prisma generate
echo "1. Prisma generate qilish..."
npx prisma generate
echo "✓ Prisma generate qilindi"

# 3. Database migration (schema'ni database'ga yozish)
echo ""
echo "2. Database migration qilish..."
npx prisma db push --skip-generate
echo "✓ Database migration qilindi"

# 4. Database mavjudligini tekshirish
echo ""
echo "3. Database mavjudligini tekshirish..."
if [ -f "dev.db" ]; then
    echo "✓ Database fayli mavjud: dev.db"
    
    # Jadval mavjudligini tekshirish
    if sqlite3 dev.db "SELECT name FROM sqlite_master WHERE type='table' AND name='User';" | grep -q "User"; then
        echo "✓ User jadvali mavjud"
    else
        echo "⚠ User jadvali topilmadi - migration qayta ishga tushirilmoqda..."
        npx prisma db push --force-reset --skip-generate
    fi
else
    echo "⚠ Database fayli topilmadi - yaratilmoqda..."
    npx prisma db push --skip-generate
fi

# 5. Barcha jadvallarni ko'rsatish
echo ""
echo "4. Database jadvallari:"
sqlite3 dev.db "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" 2>/dev/null || echo "⚠ Database'ni o'qib bo'lmadi"

echo ""
echo "=== Database Sozlash Tugadi ==="
echo ""
echo "Endi admin yaratish mumkin:"
echo "   node scripts/create-admin.js <login> <parol> <ism>"
echo ""
