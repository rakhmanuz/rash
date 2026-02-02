#!/bin/bash

# rash.uz sayt holatini to'liq tekshirish

echo "🔍 rash.uz sayt holatini tekshirish..."
echo ""

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. PM2 Status
echo "1️⃣ PM2 Status:"
pm2 status | grep rash
if pm2 list | grep -q "rash.*online"; then
    echo -e "${GREEN}✅ PM2 rash process online${NC}"
else
    echo -e "${RED}❌ PM2 rash process offline${NC}"
fi
echo ""

# 2. Port 3000
echo "2️⃣ Port 3000:"
if netstat -tulpn | grep -q ":3000" || ss -tulpn | grep -q ":3000"; then
    echo -e "${GREEN}✅ Port 3000 ochiq${NC}"
    netstat -tulpn | grep ":3000" || ss -tulpn | grep ":3000"
else
    echo -e "${RED}❌ Port 3000 ochiq emas${NC}"
fi
echo ""

# 3. Localhost:3000 Test
echo "3️⃣ http://localhost:3000 Test:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ http://localhost:3000 ishlayapti (HTTP $HTTP_CODE)${NC}"
    curl -I http://localhost:3000 2>&1 | head -3
else
    echo -e "${RED}❌ http://localhost:3000 ishlamayapti (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# 4. Nginx Status
echo "4️⃣ Nginx Status:"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx ishlayapti${NC}"
    systemctl status nginx --no-pager | head -3
else
    echo -e "${RED}❌ Nginx ishlamayapti${NC}"
fi
echo ""

# 5. Port 80
echo "5️⃣ Port 80:"
if netstat -tulpn | grep -q ":80 " || ss -tulpn | grep -q ":80 "; then
    echo -e "${GREEN}✅ Port 80 ochiq${NC}"
    netstat -tulpn | grep ":80 " || ss -tulpn | grep ":80 "
else
    echo -e "${RED}❌ Port 80 ochiq emas${NC}"
fi
echo ""

# 6. Nginx Konfiguratsiyasi
echo "6️⃣ Nginx Konfiguratsiyasi:"
if [ -f /etc/nginx/sites-available/rash.uz ]; then
    echo -e "${GREEN}✅ Nginx konfiguratsiyasi mavjud${NC}"
    if [ -L /etc/nginx/sites-enabled/rash.uz ]; then
        echo -e "${GREEN}✅ Symlink mavjud${NC}"
    else
        echo -e "${YELLOW}⚠️ Symlink yo'q${NC}"
    fi
    if nginx -t 2>&1 | grep -q "successful"; then
        echo -e "${GREEN}✅ Nginx konfiguratsiyasi to'g'ri${NC}"
    else
        echo -e "${RED}❌ Nginx konfiguratsiyasida xatolik${NC}"
        nginx -t
    fi
else
    echo -e "${RED}❌ Nginx konfiguratsiyasi yo'q${NC}"
fi
echo ""

# 7. DNS Tekshirish
echo "7️⃣ DNS Tekshirish:"
SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || hostname -I | awk '{print $1}')
echo -e "${BLUE}Server IP: $SERVER_IP${NC}"

DNS_IP=$(dig +short rash.uz 2>/dev/null | tail -1)
if [ -z "$DNS_IP" ]; then
    echo -e "${RED}❌ DNS sozlanmagan yoki rash.uz topilmadi${NC}"
    echo -e "${YELLOW}⚠️ DNS sozlash kerak: rash.uz → $SERVER_IP${NC}"
else
    echo -e "${GREEN}✅ DNS sozlangan: rash.uz → $DNS_IP${NC}"
    if [ "$DNS_IP" != "$SERVER_IP" ]; then
        echo -e "${YELLOW}⚠️ DNS IP ($DNS_IP) server IP ($SERVER_IP) bilan mos kelmayapti${NC}"
    fi
fi
echo ""

# 8. Domain Test (agar DNS sozlangan bo'lsa)
echo "8️⃣ Domain Test:"
if [ -n "$DNS_IP" ] && [ "$DNS_IP" = "$SERVER_IP" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://rash.uz 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        echo -e "${GREEN}✅ http://rash.uz ishlayapti (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "${RED}❌ http://rash.uz ishlamayapti (HTTP $HTTP_CODE)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ DNS sozlanmagan, domain test qilinmaydi${NC}"
fi
echo ""

# 9. Firewall
echo "9️⃣ Firewall:"
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "Status: active"; then
        echo "UFW firewall faol:"
        ufw status | grep -E "80|443" || echo "Port 80/443 ochiq emas"
    else
        echo "UFW firewall faol emas"
    fi
fi
echo ""

# 10. Xulosa
echo "📊 Xulosa:"
echo ""
if pm2 list | grep -q "rash.*online" && \
   (netstat -tulpn | grep -q ":3000" || ss -tulpn | grep -q ":3000") && \
   systemctl is-active --quiet nginx && \
   [ -f /etc/nginx/sites-available/rash.uz ]; then
    echo -e "${GREEN}✅ Barcha server komponentlari ishlayapti${NC}"
    if [ -n "$DNS_IP" ] && [ "$DNS_IP" = "$SERVER_IP" ]; then
        echo -e "${GREEN}✅ DNS sozlangan${NC}"
        echo -e "${GREEN}🎉 rash.uz sayti ishlashi kerak!${NC}"
    else
        echo -e "${YELLOW}⚠️ DNS sozlash kerak${NC}"
        echo -e "${BLUE}DNS sozlash: rash.uz → $SERVER_IP${NC}"
    fi
else
    echo -e "${RED}❌ Ba'zi komponentlar ishlamayapti${NC}"
    echo -e "${YELLOW}FIX_RASH_UZ_NOW.sh scriptini ishga tushiring${NC}"
fi
echo ""
