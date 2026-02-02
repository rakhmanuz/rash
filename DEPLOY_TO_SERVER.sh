#!/bin/bash

# rash.uz serverga to'liq deployment

echo "🚀 rash.uz serverga yuklash..."
echo ""

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /var/www/rash || exit 1

# 1. Git Pull
echo "1️⃣ Git yangilash..."
git stash 2>/dev/null
git pull origin main
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Git yangilandi${NC}"
else
    echo -e "${RED}❌ Git pull xatolik${NC}"
    exit 1
fi
echo ""

# 2. Dependencies
echo "2️⃣ Dependencies o'rnatish..."
npm ci --production=false
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies o'rnatildi${NC}"
else
    echo -e "${RED}❌ Dependencies o'rnatishda xatolik${NC}"
    exit 1
fi
echo ""

# 3. Prisma Generate
echo "3️⃣ Prisma Generate..."
npx prisma generate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma generate muvaffaqiyatli${NC}"
else
    echo -e "${RED}❌ Prisma generate xatolik${NC}"
    exit 1
fi
echo ""

# 4. Build
echo "4️⃣ Build qilish..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build muvaffaqiyatli${NC}"
else
    echo -e "${RED}❌ Build xatolik${NC}"
    exit 1
fi
echo ""

# 5. PM2 Restart
echo "5️⃣ PM2 Restart..."
pm2 restart rash
sleep 3
if pm2 list | grep -q "rash.*online"; then
    echo -e "${GREEN}✅ PM2 rash process online${NC}"
else
    echo -e "${YELLOW}⚠️ PM2 restart qilish..."
    pm2 delete rash 2>/dev/null
    pm2 start ecosystem.config.js
    pm2 save
    sleep 3
    if pm2 list | grep -q "rash.*online"; then
        echo -e "${GREEN}✅ PM2 rash process online${NC}"
    else
        echo -e "${RED}❌ PM2 rash process offline${NC}"
        exit 1
    fi
fi
echo ""

# 6. Port 3000 Tekshirish
echo "6️⃣ Port 3000 Tekshirish:"
sleep 2
if command -v ss &> /dev/null; then
    if ss -tulpn | grep -q ":3000"; then
        echo -e "${GREEN}✅ Port 3000 ochiq${NC}"
    else
        echo -e "${RED}❌ Port 3000 ochiq emas${NC}"
        pm2 restart rash
        sleep 3
    fi
fi
echo ""

# 7. Localhost Test
echo "7️⃣ http://localhost:3000 Test:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ http://localhost:3000 ishlayapti (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ http://localhost:3000 ishlamayapti (HTTP $HTTP_CODE)${NC}"
    echo "PM2 loglar:"
    pm2 logs rash --lines 10 --nostream
fi
echo ""

# 8. Nginx Status
echo "8️⃣ Nginx Status:"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx ishlayapti${NC}"
else
    echo -e "${RED}❌ Nginx ishlamayapti${NC}"
    systemctl start nginx
    systemctl enable nginx
    sleep 2
fi
echo ""

# 9. Domain Test
echo "9️⃣ Domain Test:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://rash.uz 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ http://rash.uz ishlayapti (HTTP $HTTP_CODE)${NC}"
    echo -e "${GREEN}🎉 Deployment muvaffaqiyatli!${NC}"
else
    echo -e "${YELLOW}⚠️ http://rash.uz ishlamayapti (HTTP $HTTP_CODE)${NC}"
    echo "Tekshirish:"
    echo "1. DNS: dig rash.uz"
    echo "2. Nginx loglar: tail -20 /var/log/nginx/rash.uz.error.log"
    echo "3. PM2 loglar: pm2 logs rash --lines 20"
fi
echo ""

# 10. Final Status
echo "📊 Final Status:"
echo "PM2:"
pm2 status | grep rash
echo ""
echo "Nginx:"
systemctl status nginx --no-pager | head -3
echo ""
echo -e "${GREEN}✅ Deployment yakunlandi!${NC}"
echo ""
