#!/bin/bash

# rash.uz saytini ishga tushirish - Tezkor tuzatish

echo "🔧 rash.uz saytini ishga tushirish..."
echo ""

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Papkaga o'tish
echo "1️⃣ Papkaga o'tish..."
cd /var/www/rash || { echo -e "${RED}❌ /var/www/rash papkasi topilmadi${NC}"; exit 1; }
echo -e "${GREEN}✅ /var/www/rash papkasida${NC}"

# 2. Git Pull
echo ""
echo "2️⃣ Git'dan yangilanishlarni olish..."
git fetch origin
git reset --hard origin/main
echo -e "${GREEN}✅ Git yangilandi${NC}"

# 3. Dependencies
echo ""
echo "3️⃣ Dependencies o'rnatish..."
npm ci --production=false
echo -e "${GREEN}✅ Dependencies o'rnatildi${NC}"

# 4. Prisma
echo ""
echo "4️⃣ Prisma generate..."
npx prisma generate
echo -e "${GREEN}✅ Prisma generate yakunlandi${NC}"

# 5. Build
echo ""
echo "5️⃣ Production build..."
rm -rf .next
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build muvaffaqiyatli${NC}"
else
    echo -e "${RED}❌ Build xatolik${NC}"
    exit 1
fi

# 6. PM2
echo ""
echo "6️⃣ PM2 sozlash..."
pm2 delete rash 2>/dev/null
pm2 start ecosystem.config.js
pm2 save
sleep 3

if pm2 list | grep -q "rash.*online"; then
    echo -e "${GREEN}✅ PM2 rash process online${NC}"
else
    echo -e "${RED}❌ PM2 rash process offline${NC}"
    pm2 logs rash --lines 10 --nostream
fi

# 7. Port 3000 Tekshirish
echo ""
echo "7️⃣ Port 3000 tekshirish..."
sleep 2
if netstat -tulpn | grep -q ":3000" || ss -tulpn | grep -q ":3000"; then
    echo -e "${GREEN}✅ Port 3000 ochiq${NC}"
else
    echo -e "${RED}❌ Port 3000 ochiq emas${NC}"
    pm2 restart rash
    sleep 3
fi

# 8. Localhost Test
echo ""
echo "8️⃣ http://localhost:3000 test..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ http://localhost:3000 ishlayapti (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ http://localhost:3000 ishlamayapti (HTTP $HTTP_CODE)${NC}"
    pm2 logs rash --lines 10 --nostream
fi

# 9. Nginx
echo ""
echo "9️⃣ Nginx sozlash..."

# Nginx konfiguratsiyasini yaratish
cat > /etc/nginx/sites-available/rash.uz << 'EOF'
server {
    listen 80;
    server_name rash.uz www.rash.uz;

    access_log /var/log/nginx/rash.uz.access.log;
    error_log /var/log/nginx/rash.uz.error.log;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Symlink
ln -sf /etc/nginx/sites-available/rash.uz /etc/nginx/sites-enabled/

# Nginx test va reload
if nginx -t 2>&1 | grep -q "successful"; then
    systemctl reload nginx
    echo -e "${GREEN}✅ Nginx sozlandi va qayta ishga tushirildi${NC}"
else
    echo -e "${RED}❌ Nginx konfiguratsiyasida xatolik${NC}"
    nginx -t
fi

# 10. Nginx Status
echo ""
echo "🔟 Nginx status..."
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx ishlayapti${NC}"
else
    echo -e "${RED}❌ Nginx ishlamayapti${NC}"
    systemctl start nginx
fi

# 11. Firewall
echo ""
echo "1️⃣1️⃣ Firewall sozlash..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo -e "${GREEN}✅ Firewall portlari ochildi${NC}"
fi

# 12. Final Status
echo ""
echo "✅ Sozlash yakunlandi!"
echo ""
echo "📊 Status:"
echo "PM2:"
pm2 status | grep rash
echo ""
echo "Port 3000:"
netstat -tulpn | grep ":3000" || ss -tulpn | grep ":3000"
echo ""
echo "Port 80:"
netstat -tulpn | grep ":80 " || ss -tulpn | grep ":80 "
echo ""
echo "Nginx:"
systemctl status nginx --no-pager | head -3
echo ""
echo "Test:"
curl -I http://localhost:3000 2>&1 | head -1
echo ""
echo -e "${GREEN}🎉 Barcha sozlamalar yakunlandi!${NC}"
echo ""
echo -e "${BLUE}📝 Keyingi qadamlar:${NC}"
echo "1. DNS tekshirish: dig rash.uz"
echo "2. Browser'da rash.uz ni oching"
echo "3. Agar hali ham xatolik bo'lsa:"
echo "   - PM2 loglar: pm2 logs rash"
echo "   - Nginx loglar: tail -f /var/log/nginx/rash.uz.error.log"
echo ""
