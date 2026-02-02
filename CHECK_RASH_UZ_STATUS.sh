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
if command -v ss &> /dev/null; then
    if ss -tulpn | grep -q ":3000"; then
        echo -e "${GREEN}✅ Port 3000 ochiq${NC}"
        ss -tulpn | grep ":3000"
    else
        echo -e "${RED}❌ Port 3000 ochiq emas${NC}"
    fi
elif command -v netstat &> /dev/null; then
    if netstat -tulpn | grep -q ":3000"; then
        echo -e "${GREEN}✅ Port 3000 ochiq${NC}"
        netstat -tulpn | grep ":3000"
    else
        echo -e "${RED}❌ Port 3000 ochiq emas${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ netstat va ss topilmadi${NC}"
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
if command -v ss &> /dev/null; then
    if ss -tulpn | grep -q ":80 "; then
        echo -e "${GREEN}✅ Port 80 ochiq${NC}"
        ss -tulpn | grep ":80 "
    else
        echo -e "${RED}❌ Port 80 ochiq emas${NC}"
    fi
elif command -v netstat &> /dev/null; then
    if netstat -tulpn | grep -q ":80 "; then
        echo -e "${GREEN}✅ Port 80 ochiq${NC}"
        netstat -tulpn | grep ":80 "
    else
        echo -e "${RED}❌ Port 80 ochiq emas${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ netstat va ss topilmadi${NC}"
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
# IPv4 IP ni aniqlash (bir necha usul bilan, faqat IPv4)
SERVER_IPV4=""

# Usul 1: curl -4 ifconfig.me
SERVER_IPV4=$(curl -s -4 --max-time 10 ifconfig.me 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)

# Usul 2: curl -4 icanhazip.com
if [ -z "$SERVER_IPV4" ]; then
    SERVER_IPV4=$(curl -s -4 --max-time 10 icanhazip.com 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
fi

# Usul 3: hostname -I dan IPv4 ni ajratish
if [ -z "$SERVER_IPV4" ]; then
    SERVER_IPV4=$(hostname -I 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i ~ /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/ && $i !~ /^127\./) {print $i; exit}}')
fi

# Usul 4: ip addr dan IPv4 ni olish
if [ -z "$SERVER_IPV4" ]; then
    SERVER_IPV4=$(ip -4 addr show 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '^127\.' | head -1)
fi

if [ -n "$SERVER_IPV4" ]; then
    echo -e "${BLUE}Server IPv4: $SERVER_IPV4${NC}"
    SERVER_IP="$SERVER_IPV4"
else
    echo -e "${RED}❌ IPv4 IP topilmadi${NC}"
    echo -e "${YELLOW}Qo'lda tekshirish: curl -4 ifconfig.me${NC}"
    SERVER_IPV4=""
    SERVER_IP=""
fi

DNS_IP=$(dig +short rash.uz A 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
if [ -z "$DNS_IP" ]; then
    echo -e "${RED}❌ DNS sozlanmagan yoki rash.uz topilmadi${NC}"
    if [ -n "$SERVER_IPV4" ]; then
        echo -e "${YELLOW}⚠️ DNS sozlash kerak: rash.uz → $SERVER_IPV4${NC}"
    fi
else
    echo -e "${GREEN}✅ DNS sozlangan: rash.uz → $DNS_IP${NC}"
    if [ -n "$SERVER_IPV4" ]; then
        if [ "$DNS_IP" = "$SERVER_IPV4" ]; then
            echo -e "${GREEN}✅ DNS to'g'ri sozlangan (DNS IP = Server IPv4)${NC}"
        else
            echo -e "${RED}❌ DNS IP ($DNS_IP) server IPv4 ($SERVER_IPV4) bilan mos kelmayapti${NC}"
            echo -e "${YELLOW}⚠️ DNS'ni to'g'rilash kerak: rash.uz → $SERVER_IPV4${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ Server IPv4 IP aniqlanmadi, qo'lda tekshirish kerak${NC}"
    fi
fi
echo ""

# 8. Domain Test
echo "8️⃣ Domain Test:"
if [ -n "$DNS_IP" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://rash.uz 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        echo -e "${GREEN}✅ http://rash.uz ishlayapti (HTTP $HTTP_CODE)${NC}"
        echo -e "${GREEN}🎉 Sayt muvaffaqiyatli ishlayapti!${NC}"
    else
        echo -e "${RED}❌ http://rash.uz ishlamayapti (HTTP $HTTP_CODE)${NC}"
        if [ -n "$SERVER_IPV4" ] && [ "$DNS_IP" != "$SERVER_IPV4" ]; then
            echo -e "${YELLOW}⚠️ DNS IP ($DNS_IP) server IPv4 ($SERVER_IPV4) bilan mos kelmayapti${NC}"
        fi
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

# Port tekshirish (ss yoki netstat)
PORT_3000_OK=false
if command -v ss &> /dev/null; then
    ss -tulpn | grep -q ":3000" && PORT_3000_OK=true
elif command -v netstat &> /dev/null; then
    netstat -tulpn | grep -q ":3000" && PORT_3000_OK=true
fi

if pm2 list | grep -q "rash.*online" && \
   [ "$PORT_3000_OK" = true ] && \
   systemctl is-active --quiet nginx && \
   [ -f /etc/nginx/sites-available/rash.uz ]; then
    echo -e "${GREEN}✅ Barcha server komponentlari ishlayapti${NC}"
    if [ -n "$DNS_IP" ] && [ -n "$SERVER_IPV4" ] && [ "$DNS_IP" = "$SERVER_IPV4" ]; then
        echo -e "${GREEN}✅ DNS to'g'ri sozlangan${NC}"
        echo -e "${GREEN}🎉 rash.uz sayti ishlashi kerak!${NC}"
    else
        echo -e "${RED}❌ DNS muammosi${NC}"
        if [ -n "$DNS_IP" ] && [ -n "$SERVER_IPV4" ]; then
            echo -e "${YELLOW}⚠️ DNS IP ($DNS_IP) server IPv4 ($SERVER_IPV4) bilan mos kelmayapti${NC}"
        fi
        echo -e "${BLUE}DNS sozlash: rash.uz → $SERVER_IPV4${NC}"
        echo -e "${YELLOW}Domen provayderingizda A record qo'shing:${NC}"
        echo -e "${BLUE}  Name: @ (yoki rash.uz)${NC}"
        echo -e "${BLUE}  Type: A${NC}"
        echo -e "${BLUE}  Value: $SERVER_IPV4${NC}"
    fi
else
    echo -e "${RED}❌ Ba'zi komponentlar ishlamayapti${NC}"
    echo -e "${YELLOW}FIX_RASH_UZ_NOW.sh scriptini ishga tushiring${NC}"
fi
echo ""
