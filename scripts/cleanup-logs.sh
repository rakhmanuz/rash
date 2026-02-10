#!/bin/bash

# Faqat loglarni tozalash (non-interactive)

echo "🧹 Loglarni tozalash..."
echo ""

cd /var/www/rash || exit 1

# PM2 loglarini tozalash
echo "PM2 loglarini tozalash..."
pm2 flush rash 2>/dev/null
rm -f /root/.pm2/logs/rash-error.log.* 2>/dev/null
rm -f /root/.pm2/logs/rash-out.log.* 2>/dev/null
echo "✅ PM2 loglar tozalandi"
echo ""

# Next.js cache tozalash
echo "Next.js cache tozalash..."
rm -rf .next/cache 2>/dev/null
rm -rf node_modules/.cache 2>/dev/null
echo "✅ Cache tozalandi"
echo ""

# Temporary fayllar
echo "Temporary fayllarni tozalash..."
find . -name "*.tmp" -type f -delete 2>/dev/null
find . -name ".DS_Store" -type f -delete 2>/dev/null
echo "✅ Temporary fayllar tozalandi"
echo ""

echo "✅ Tozalash yakunlandi!"
