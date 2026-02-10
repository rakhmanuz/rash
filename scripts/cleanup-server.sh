#!/bin/bash

# Server tozalash skripti - eski loglar va keraksiz fayllarni o'chirish

echo "🧹 Server tozalash boshlandi..."
echo ""

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /var/www/rash || exit 1

# 1. PM2 loglarini tozalash
echo "1️⃣ PM2 loglarini tozalash..."
pm2 flush rash 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PM2 loglar tozalandi${NC}"
else
    echo -e "${YELLOW}⚠️ PM2 loglar tozalashda xatolik${NC}"
fi
echo ""

# 2. PM2 eski log fayllarini o'chirish
echo "2️⃣ PM2 eski log fayllarini o'chirish..."
rm -f /root/.pm2/logs/rash-error.log.* 2>/dev/null
rm -f /root/.pm2/logs/rash-out.log.* 2>/dev/null
rm -f /root/.pm2/logs/rash-error-*.log 2>/dev/null
rm -f /root/.pm2/logs/rash-out-*.log 2>/dev/null
echo -e "${GREEN}✅ PM2 eski log fayllar o'chirildi${NC}"
echo ""

# 3. Next.js build cache tozalash
echo "3️⃣ Next.js build cache tozalash..."
rm -rf .next/cache 2>/dev/null
rm -rf .next/static 2>/dev/null
rm -rf .next/trace 2>/dev/null
rm -rf .next/cache/webpack 2>/dev/null
rm -rf .next/cache/images 2>/dev/null
rm -rf node_modules/.cache 2>/dev/null
rm -rf .swc 2>/dev/null
echo -e "${GREEN}✅ Build cache tozalandi${NC}"
echo ""

# 4. Node modules cache tozalash
echo "4️⃣ Node modules cache tozalash..."
rm -rf node_modules/.cache 2>/dev/null
rm -rf node_modules/.prisma 2>/dev/null
find node_modules -name ".cache" -type d -exec rm -rf {} + 2>/dev/null
echo -e "${GREEN}✅ Node modules cache tozalandi${NC}"
echo ""

# 5. Nginx loglarini tozalash (agar kerak bo'lsa)
echo "5️⃣ Nginx loglarini tekshirish..."
if [ -f /var/log/nginx/rash.uz.access.log ]; then
    echo -e "${YELLOW}⚠️ Nginx access log mavjud (katta bo'lishi mumkin)${NC}"
    echo "   Fayl hajmi: $(du -h /var/log/nginx/rash.uz.access.log | cut -f1)"
    read -p "   Nginx access log'ni tozalashni xohlaysizmi? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        > /var/log/nginx/rash.uz.access.log
        echo -e "${GREEN}✅ Nginx access log tozalandi${NC}"
    fi
fi

if [ -f /var/log/nginx/rash.uz.error.log ]; then
    echo -e "${YELLOW}⚠️ Nginx error log mavjud${NC}"
    echo "   Fayl hajmi: $(du -h /var/log/nginx/rash.uz.error.log | cut -f1)"
    read -p "   Nginx error log'ni tozalashni xohlaysizmi? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        > /var/log/nginx/rash.uz.error.log
        echo -e "${GREEN}✅ Nginx error log tozalandi${NC}"
    fi
fi
echo ""

# 6. Temporary fayllarni tozalash
echo "6️⃣ Temporary fayllarni tozalash..."
find . -name "*.tmp" -type f -delete 2>/dev/null
find . -name "*.log" -type f -not -path "./node_modules/*" -not -path "./.next/*" -delete 2>/dev/null
find . -name ".DS_Store" -type f -delete 2>/dev/null
find . -name "Thumbs.db" -type f -delete 2>/dev/null
echo -e "${GREEN}✅ Temporary fayllar tozalandi${NC}"
echo ""

# 7. Disk foydalanilgan joyni ko'rsatish
echo "7️⃣ Disk foydalanilgan joy:"
df -h /var/www/rash | tail -1
echo ""

# 8. Eng katta fayllarni ko'rsatish
echo "8️⃣ Eng katta fayllar (top 10):"
du -h /var/www/rash 2>/dev/null | sort -rh | head -10
echo ""

# 9. PM2 loglar hajmini ko'rsatish
echo "9️⃣ PM2 loglar hajmi:"
if [ -d /root/.pm2/logs ]; then
    du -sh /root/.pm2/logs/*.log 2>/dev/null | head -5
fi
echo ""

echo -e "${GREEN}✅ Server tozalash yakunlandi!${NC}"
echo ""
