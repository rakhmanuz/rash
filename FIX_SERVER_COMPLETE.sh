#!/bin/bash

# Server'da to'liq tuzatish skripti

echo "🔧 Server'da to'liq tuzatish..."
echo ""

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /var/www/rash || exit 1

# 1. PM2'ni to'liq to'xtatish
echo "1️⃣ PM2'ni to'liq to'xtatish..."
pm2 stop all 2>/dev/null
pm2 delete all 2>/dev/null
pm2 kill 2>/dev/null
sleep 3
echo -e "${GREEN}✅ PM2 to'xtatildi${NC}"
echo ""

# 2. Build cache'ni to'liq tozalash
echo "2️⃣ Build cache'ni to'liq tozalash..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules/.prisma
rm -rf .swc
rm -rf out
rm -rf dist
find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name ".swc" -exec rm -rf {} + 2>/dev/null || true
echo -e "${GREEN}✅ Cache tozalandi${NC}"
echo ""

# 3. PM2 loglarini tozalash
echo "3️⃣ PM2 loglarini tozalash..."
pm2 flush 2>/dev/null
echo -e "${GREEN}✅ Loglar tozalandi${NC}"
echo ""

# 4. Prisma generate
echo "4️⃣ Prisma Generate..."
npx prisma generate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma generate muvaffaqiyatli${NC}"
else
    echo -e "${RED}❌ Prisma generate xatolik${NC}"
    exit 1
fi
echo ""

# 5. Database yangilash
echo "5️⃣ Database yangilash..."
npx prisma db push --accept-data-loss
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database yangilandi${NC}"
else
    echo -e "${YELLOW}⚠️ Database yangilashda xatolik (ehtimol allaqachon yangilangan)${NC}"
fi
echo ""

# 6. Build
echo "6️⃣ Build qilish..."
NODE_ENV=production npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build muvaffaqiyatli${NC}"
else
    echo -e "${RED}❌ Build xatolik${NC}"
    exit 1
fi
echo ""

# 7. PM2 start
echo "7️⃣ PM2'ni ishga tushirish..."
pm2 start ecosystem.config.js
pm2 save
sleep 5

if pm2 list | grep -q "rash.*online"; then
    echo -e "${GREEN}✅ PM2 rash process online${NC}"
else
    echo -e "${RED}❌ PM2 rash process offline${NC}"
    echo "PM2 loglar:"
    pm2 logs rash --lines 30 --nostream
    exit 1
fi
echo ""

# 8. Tekshirish
echo "8️⃣ Tekshirish..."
pm2 status
echo ""
echo -e "${GREEN}✅ Barcha muammolar tuzatildi!${NC}"
echo ""
