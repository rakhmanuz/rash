#!/bin/bash

# rash.uz saytini to'liq ishga tushirish

echo "🚀 rash.uz saytini ishga tushirish..."
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
echo ""

# 2. PM2 Restart
echo "2️⃣ PM2 Restart:"
pm2 restart rash
sleep 3
if pm2 list | grep -q "rash.*online"; then
    echo -e "${GREEN}✅ PM2 rash process online${NC}"
else
    echo -e "${RED}❌ PM2 rash process offline${NC}"
    pm2 start ecosystem.config.js
    pm2 save
    sleep 3
fi
echo ""

# 3. Port 3000 Tekshirish
echo "3️⃣ Port 3000:"
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

# 4. Localhost Test
echo "4️⃣ http://localhost:3000 Test:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ http://localhost:3000 ishlayapti (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ http://localhost:3000 ishlamayapti (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# 5. Nginx Konfiguratsiyasi
echo "5️⃣ Nginx Konfiguratsiyasi:"
if [ ! -f /etc/nginx/sites-available/rash.uz ]; then
    echo "Nginx konfiguratsiyasini yaratish..."
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
    echo -e "${GREEN}✅ Nginx konfiguratsiyasi yaratildi${NC}"
fi

# Symlink
if [ ! -L /etc/nginx/sites-enabled/rash.uz ]; then
    ln -sf /etc/nginx/sites-available/rash.uz /etc/nginx/sites-enabled/
    echo -e "${GREEN}✅ Symlink yaratildi${NC}"
fi

# Nginx test va reload
if nginx -t 2>&1 | grep -q "successful"; then
    systemctl reload nginx
    echo -e "${GREEN}✅ Nginx konfiguratsiyasi to'g'ri${NC}"
else
    echo -e "${RED}❌ Nginx konfiguratsiyasida xatolik${NC}"
    nginx -t
fi
echo ""

# 6. Nginx Status
echo "6️⃣ Nginx Status:"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx ishlayapti${NC}"
else
    echo -e "${RED}❌ Nginx ishlamayapti${NC}"
    systemctl start nginx
    systemctl enable nginx
    sleep 2
fi
echo ""

# 7. Port 80 Tekshirish
echo "7️⃣ Port 80:"
if command -v ss &> /dev/null; then
    if ss -tulpn | grep -q ":80 "; then
        echo -e "${GREEN}✅ Port 80 ochiq${NC}"
        ss -tulpn | grep ":80 " | head -2
    else
        echo -e "${RED}❌ Port 80 ochiq emas${NC}"
        systemctl restart nginx
        sleep 2
    fi
else
    echo -e "${YELLOW}⚠️ ss topilmadi${NC}"
fi
echo ""

# 8. Firewall
echo "8️⃣ Firewall:"
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp 2>/dev/null
    ufw allow 443/tcp 2>/dev/null
    echo -e "${GREEN}✅ Firewall portlari ochildi${NC}"
fi
echo ""

# 9. Domain Test
echo "9️⃣ Domain Test:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://rash.uz 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ http://rash.uz ishlayapti (HTTP $HTTP_CODE)${NC}"
    echo -e "${GREEN}🎉 Sayt muvaffaqiyatli ishlayapti!${NC}"
else
    echo -e "${RED}❌ http://rash.uz ishlamayapti (HTTP $HTTP_CODE)${NC}"
    echo ""
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
echo "Port 80:"
ss -tulpn | grep ":80 " 2>/dev/null | head -2 || echo "ss topilmadi"
echo ""
echo "Test:"
curl -I http://localhost:3000 2>&1 | head -1
echo ""
echo -e "${GREEN}✅ Sozlash yakunlandi!${NC}"
echo ""
