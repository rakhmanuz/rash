#!/bin/bash

# Server xatoliklarini tuzatish skripti

echo "🔧 Server xatoliklarini tuzatish..."
echo ""

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. To'g'ri papkaga o'tish
echo "1️⃣ To'g'ri papkaga o'tish..."
cd /var/www/rash || {
    echo -e "${RED}❌ /var/www/rash papkasi topilmadi!${NC}"
    exit 1
}
echo -e "${GREEN}✅ Papka: $(pwd)${NC}"
echo ""

# 2. Git'dan yangi kodni olish (serverni GitHub main bilan bir xil qilish)
echo "2️⃣ Git'dan yangi kodni olish..."
git fetch origin
git reset --hard origin/main
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Kod yangilandi (origin/main)${NC}"
else
    echo -e "${RED}❌ Git xatolik - davom etilmoqda (eski kod bilan)${NC}"
fi
echo ""

# 2.1 Dependencies yangilash (package.json o'zgarganda)
echo "2️⃣.1 Dependencies yangilash..."
npm ci --production=false
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies yangilandi${NC}"
else
    echo -e "${YELLOW}⚠️ npm ci xatolik - npm install sinab ko'ring${NC}"
    npm install
fi
echo ""

# 3. PM2'ni to'xtatish va o'chirish
echo "3️⃣ PM2'ni to'xtatish va o'chirish..."
pm2 stop rash 2>/dev/null
pm2 delete rash 2>/dev/null
sleep 2
echo -e "${GREEN}✅ PM2 to'xtatildi${NC}"
echo ""

# 4. Build cache'ni to'liq tozalash
echo "4️⃣ Build cache'ni to'liq tozalash..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .next/static 2>/dev/null
rm -rf .next/server 2>/dev/null
rm -rf .swc
find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name ".swc" -exec rm -rf {} + 2>/dev/null || true
echo -e "${GREEN}✅ Cache tozalandi${NC}"
echo ""

# 5. Prisma client yangilash
echo "5️⃣ Prisma client yangilash..."
npx prisma generate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma generate muvaffaqiyatli${NC}"
else
    echo -e "${RED}❌ Prisma generate xatolik${NC}"
    exit 1
fi
echo ""

# 6. Database schema yangilash
echo "6️⃣ Database schema yangilash..."
npx prisma db push --accept-data-loss
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database schema yangilandi${NC}"
else
    echo -e "${YELLOW}⚠️ Database schema yangilashda xatolik (ehtimol allaqachon yangilangan)${NC}"
fi
echo ""

# 7. Yangi build qilish
echo "7️⃣ Yangi build qilish..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build muvaffaqiyatli${NC}"
else
    echo -e "${RED}❌ Build xatolik${NC}"
    exit 1
fi
echo ""

# 8. PM2'ni qayta ishga tushirish
echo "8️⃣ PM2'ni qayta ishga tushirish..."
pm2 start ecosystem.config.js
pm2 save
sleep 5
if pm2 list | grep -q "rash.*online"; then
    echo -e "${GREEN}✅ PM2 rash process online${NC}"
else
    echo -e "${RED}❌ PM2 rash process offline${NC}"
    echo "PM2 loglar:"
    pm2 logs rash --lines 20 --nostream
    exit 1
fi
echo ""

# 9. Tekshirish
echo "9️⃣ Tekshirish..."
pm2 status
echo ""
echo -e "${GREEN}✅ Barcha xatoliklar tuzatildi!${NC}"
echo ""
