#!/bin/bash
# rash.com.uz deploy – port 3001

cd "$(dirname "$0")/.." || exit 1

echo "📦 1. Git pull..."
git pull

echo ""
echo "📦 2. npm ci..."
npm ci

echo ""
echo "📦 3. Prisma..."
npx prisma generate

echo ""
echo "📦 4. Build..."
npm run build

echo ""
echo "🔄 5. PM2 – qayta ishga tushirish..."

# Ikkala processni to'xtatish
pm2 delete rash 2>/dev/null || true
pm2 delete rash-payment 2>/dev/null || true

# Ikkala processni yangidan ishga tushirish
pm2 start ecosystem.config.js --env production

pm2 save

echo ""
echo "✅ Status:"
pm2 status

echo ""
echo "🔍 Port 3001 tekshirish:"
sleep 2
curl -sI http://localhost:3001/ | head -3

echo ""
echo "⚠️  Nginx: rash.com.uz uchun proxy_pass http://127.0.0.1:3001 bo'lishi kerak!"
echo "    sudo nano /etc/nginx/sites-available/rash.com.uz"
