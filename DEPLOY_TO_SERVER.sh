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

# 0. .env faylini sozlash (agar mavjud bo'lmasa)
echo "0️⃣ .env faylini tekshirish..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️ .env fayl topilmadi, yaratilmoqda...${NC}"
    cat > .env << 'ENVEOF'
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="https://rash.uz"
NEXTAUTH_SECRET="ddCG/kKTGw1z3HGa5O/7lbCD/khMlZ2Yd/ZAQv2uME8="

# Google Sheets (Public Link yoki API Key)
# Published link misoli: https://docs.google.com/spreadsheets/d/e/2PACX-.../pubhtml
# Oddiy link misoli: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
# GOOGLE_SHEETS_PUBLIC_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vQhB-RMHoKIm4jxNeNcJmM3AQI2H5ZKmOoftmvQez0K6vPogRnriO_UYEGh4YCM3j8N3HSm9Qfw-fdG/pubhtml"
# GOOGLE_SHEETS_SPREADSHEET_ID=""
# GOOGLE_SHEETS_SHEET_NAME="To'lovlar"
# GOOGLE_SHEETS_API_KEY=""
ENVEOF
    chmod 600 .env
    echo -e "${GREEN}✅ .env fayl yaratildi${NC}"
else
    echo -e "${GREEN}✅ .env fayl mavjud${NC}"
    # Google Sheets sozlamalarini tekshirish va yangilash
    if ! grep -q "GOOGLE_SHEETS_PUBLIC_URL" .env; then
        echo "" >> .env
        echo "# Google Sheets (Public Link yoki API Key)" >> .env
        echo '# Published link misoli: https://docs.google.com/spreadsheets/d/e/2PACX-.../pubhtml' >> .env
        echo '# GOOGLE_SHEETS_PUBLIC_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vQhB-RMHoKIm4jxNeNcJmM3AQI2H5ZKmOoftmvQez0K6vPogRnriO_UYEGh4YCM3j8N3HSm9Qfw-fdG/pubhtml"' >> .env
        echo '# GOOGLE_SHEETS_SPREADSHEET_ID=""' >> .env
        echo '# GOOGLE_SHEETS_SHEET_NAME="To'\''lovlar"' >> .env
        echo '# GOOGLE_SHEETS_API_KEY=""' >> .env
        echo -e "${GREEN}✅ Google Sheets sozlamalari qo'shildi${NC}"
    fi
    # Eski Telegram bot sozlamalarini olib tashlash
    if grep -q "TELEGRAM_BOT_TOKEN" .env; then
        sed -i '/# Telegram Bot/,/TELEGRAM_ADMIN_ID/d' .env
        echo -e "${YELLOW}⚠️ Eski Telegram bot sozlamalari olib tashlandi${NC}"
    fi
fi
echo ""

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

# 3. Prisma Generate va Database Yangilash
echo "3️⃣ Prisma Generate va Database Yangilash..."
npx prisma generate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma generate muvaffaqiyatli${NC}"
else
    echo -e "${RED}❌ Prisma generate xatolik${NC}"
    exit 1
fi

# Database schema yangilash (yangi modellar uchun)
echo "3️⃣.1 Database schema yangilash..."
npx prisma db push --accept-data-loss
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database schema yangilandi${NC}"
else
    echo -e "${YELLOW}⚠️ Database schema yangilashda xatolik (ehtimol allaqachon yangilangan)${NC}"
fi
echo ""

# 4. PM2'ni to'xtatish (build oldidan)
echo "4️⃣ PM2'ni to'xtatish..."
pm2 stop rash 2>/dev/null
pm2 delete rash 2>/dev/null
sleep 2
echo -e "${GREEN}✅ PM2 to'xtatildi${NC}"
echo ""

# 5. Build Cache Tozalash (Chuqur tozalash)
echo "5️⃣ Build cache tozalash (chuqur tozalash)..."
# Barcha .next papkalarini tozalash
rm -rf .next
rm -rf node_modules/.cache
rm -rf out
rm -rf dist
rm -rf .swc
rm -rf .next/cache 2>/dev/null
rm -rf .next/static 2>/dev/null
rm -rf .next/server 2>/dev/null
rm -rf .next/standalone 2>/dev/null
rm -rf .next/trace 2>/dev/null
rm -rf .next/cache/webpack 2>/dev/null
rm -rf .next/cache/images 2>/dev/null
# Barcha .next papkalarini topish va o'chirish
find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name ".swc" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name ".next" -delete 2>/dev/null || true
# Node modules cache
rm -rf node_modules/.cache 2>/dev/null
rm -rf node_modules/.prisma 2>/dev/null
echo -e "${GREEN}✅ Cache tozalandi${NC}"
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

# 7. Build keyin cache tozalash (qo'shimcha)
echo "7️⃣ Build keyin cache tozalash..."
rm -rf .next/cache/webpack 2>/dev/null
rm -rf node_modules/.cache 2>/dev/null
echo -e "${GREEN}✅ Qo'shimcha cache tozalandi${NC}"
echo ""

# 8. PM2 To'liq Restart
echo "8️⃣ PM2 To'liq Restart..."
# Eski process'ni to'liq o'chirish
pm2 stop all 2>/dev/null
pm2 delete all 2>/dev/null
sleep 3
# Yangi process'ni ishga tushirish
pm2 start ecosystem.config.js
pm2 save
sleep 5
# Tekshirish
if pm2 list | grep -q "rash.*online"; then
    echo -e "${GREEN}✅ PM2 rash process online${NC}"
    # Loglarni tozalash (eski xatoliklarni olib tashlash)
    pm2 flush rash 2>/dev/null
else
    echo -e "${RED}❌ PM2 rash process offline${NC}"
    echo "PM2 loglar:"
    pm2 logs rash --lines 20 --nostream
    exit 1
fi
echo ""

# 9. Port 3000 Tekshirish
echo "9️⃣ Port 3000 Tekshirish:"
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

# 10. Localhost Test
echo "🔟 http://localhost:3000 Test:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ http://localhost:3000 ishlayapti (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ http://localhost:3000 ishlamayapti (HTTP $HTTP_CODE)${NC}"
    echo "PM2 loglar:"
    pm2 logs rash --lines 10 --nostream
fi
echo ""

# 11. Nginx Status
echo "1️⃣1️⃣ Nginx Status:"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx ishlayapti${NC}"
else
    echo -e "${RED}❌ Nginx ishlamayapti${NC}"
    systemctl start nginx
    systemctl enable nginx
    sleep 2
fi
echo ""

# 12. Domain Test
echo "1️⃣2️⃣ Domain Test:"
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

# 13. Final Status
echo "📊 Final Status:"
echo "PM2:"
pm2 status | grep rash
echo ""
echo "Nginx:"
systemctl status nginx --no-pager | head -3
echo ""
echo -e "${GREEN}✅ Deployment yakunlandi!${NC}"
echo ""
