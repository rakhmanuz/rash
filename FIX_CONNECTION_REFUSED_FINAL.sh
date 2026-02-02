#!/bin/bash

# ERR_CONNECTION_REFUSED xatolikni to'liq tuzatish

echo "🔧 ERR_CONNECTION_REFUSED xatolikni tuzatish..."
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

# 2. PM2 Status
echo "2️⃣ PM2 Status:"
if pm2 list | grep -q "rash.*online"; then
    echo -e "${GREEN}✅ PM2 rash process online${NC}"
else
    echo -e "${RED}❌ PM2 rash process offline${NC}"
    echo "PM2'ni ishga tushirish..."
    pm2 start ecosystem.config.js
    pm2 save
    sleep 3
fi
echo ""

# 3. Port 3000 Tekshirish
echo "3️⃣ Port 3000 Tekshirish:"
if command -v ss &> /dev/null; then
    if ss -tulpn | grep -q ":3000"; then
        echo -e "${GREEN}✅ Port 3000 ochiq${NC}"
    else
        echo -e "${RED}❌ Port 3000 ochiq emas${NC}"
        pm2 restart rash
        sleep 3
    fi
else
    echo -e "${YELLOW}⚠️ ss topilmadi, port tekshirilmaydi${NC}"
fi
echo ""

# 4. Localhost:3000 Test
echo "4️⃣ http://localhost:3000 Test:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ http://localhost:3000 ishlayapti (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ http://localhost:3000 ishlamayapti (HTTP $HTTP_CODE)${NC}"
    echo "PM2 loglar:"
    pm2 logs rash --lines 10 --nostream
fi
echo ""

# 5. Nginx Status
echo "5️⃣ Nginx Status:"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx ishlayapti${NC}"
else
    echo -e "${RED}❌ Nginx ishlamayapti${NC}"
    echo "Nginx'ni ishga tushirish..."
    systemctl start nginx
    systemctl enable nginx
    sleep 2
fi
echo ""

# 6. Nginx Konfiguratsiyasi
echo "6️⃣ Nginx Konfiguratsiyasi:"
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

# Nginx test
if nginx -t 2>&1 | grep -q "successful"; then
    systemctl reload nginx
    echo -e "${GREEN}✅ Nginx konfiguratsiyasi to'g'ri va qayta ishga tushirildi${NC}"
else
    echo -e "${RED}❌ Nginx konfiguratsiyasida xatolik${NC}"
    nginx -t
fi
echo ""

# 7. Port 80 Tekshirish
echo "7️⃣ Port 80 Tekshirish:"
if command -v ss &> /dev/null; then
    if ss -tulpn | grep -q ":80 "; then
        echo -e "${GREEN}✅ Port 80 ochiq${NC}"
        ss -tulpn | grep ":80 "
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
    if ufw status | grep -q "Status: active"; then
        echo "UFW firewall faol, portlarni ochish..."
        ufw allow 80/tcp
        ufw allow 443/tcp
        echo -e "${GREEN}✅ Firewall portlari ochildi${NC}"
    else
        echo "UFW firewall faol emas"
    fi
fi
echo ""

# 9. DNS Tekshirish
echo "9️⃣ DNS Tekshirish:"
SERVER_IPV4="144.91.108.158"
DNS_IP=$(dig +short rash.uz A 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)

echo -e "${BLUE}Server IPv4: $SERVER_IPV4${NC}"
if [ -n "$DNS_IP" ]; then
    echo -e "${GREEN}✅ DNS sozlangan: rash.uz → $DNS_IP${NC}"
    if [ "$DNS_IP" = "$SERVER_IPV4" ]; then
        echo -e "${GREEN}✅ DNS to'g'ri sozlangan${NC}"
    else
        echo -e "${YELLOW}⚠️ DNS IP ($DNS_IP) server IPv4 ($SERVER_IPV4) bilan mos kelmayapti${NC}"
    fi
else
    echo -e "${RED}❌ DNS sozlanmagan${NC}"
fi
echo ""

# 10. Domain Test
echo "🔟 Domain Test:"
if [ -n "$DNS_IP" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://rash.uz 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        echo -e "${GREEN}✅ http://rash.uz ishlayapti (HTTP $HTTP_CODE)${NC}"
        echo -e "${GREEN}🎉 Sayt muvaffaqiyatli ishlayapti!${NC}"
    else
        echo -e "${RED}❌ http://rash.uz ishlamayapti (HTTP $HTTP_CODE)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ DNS sozlanmagan, domain test qilinmaydi${NC}"
fi
echo ""

# 11. Final Status
echo "📊 Final Status:"
echo "PM2:"
pm2 status | grep rash
echo ""
echo "Nginx:"
systemctl status nginx --no-pager | head -3
echo ""
echo "Port 80:"
ss -tulpn | grep ":80 " 2>/dev/null || echo "ss topilmadi"
echo ""
echo -e "${GREEN}✅ Tuzatish yakunlandi!${NC}"
echo ""
echo "Agar hali ham ishlamasa:"
echo "1. DNS tekshirish: dig rash.uz"
echo "2. PM2 loglar: pm2 logs rash"
echo "3. Nginx loglar: tail -f /var/log/nginx/rash.uz.error.log"
echo ""
