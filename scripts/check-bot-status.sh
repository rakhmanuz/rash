#!/bin/bash

# Bot status va loglarini tekshirish skripti

echo "🔍 Bot Status va Loglarini Tekshirish"
echo ""

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /var/www/rash || exit 1

# 1. PM2 Status
echo "1️⃣ PM2 Status:"
pm2 status
echo ""

# 2. PM2 Loglar (oxirgi 50 qator)
echo "2️⃣ PM2 Loglar (oxirgi 50 qator):"
echo -e "${BLUE}=== Error Logs ===${NC}"
pm2 logs rash --err --lines 50 --nostream
echo ""
echo -e "${BLUE}=== Output Logs ===${NC}"
pm2 logs rash --out --lines 50 --nostream
echo ""

# 3. Real-time loglar (agar kerak bo'lsa)
echo "3️⃣ Real-time loglar (Ctrl+C bosib to'xtatish mumkin):"
read -p "Real-time loglarni ko'rishni xohlaysizmi? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Real-time loglar (Ctrl+C bosib to'xtating):"
    pm2 logs rash --lines 20
fi

echo ""
echo -e "${GREEN}✅ Tekshirish yakunlandi${NC}"
