#!/bin/bash
# Serverda ishlatish: cd /path/to/IQMax && bash scripts/deploy-on-server.sh
set -e
echo "→ git pull..."
git pull origin main
echo "→ npm ci..."
npm ci
echo "→ prisma generate..."
npx prisma generate
echo "→ prisma migrate deploy..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push
echo "→ npm run build..."
npm run build
echo "→ pm2 restart rash..."
pm2 restart rash
echo "✅ Deploy tugadi."
