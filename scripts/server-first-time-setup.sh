#!/bin/bash
# Serverda loyihani BIRINCHI MARTA o'rnatish.
# /root da ishlatish: bash server-first-time-setup.sh
# Yoki skriptni loyiha ichiga nusxalab, loyiha papkasida: bash scripts/server-first-time-setup.sh

set -e
REPO_URL="${REPO_URL:-https://github.com/rakhmanuz/rash.git}"
INSTALL_DIR="${INSTALL_DIR:-/root/rash}"

echo "=== RASH serverda birinchi marta o'rnatish ==="
echo "Repo: $REPO_URL"
echo "Papka: $INSTALL_DIR"
echo ""

if [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/package.json" ]; then
  echo "Loyiha allaqachon mavjud: $INSTALL_DIR"
  echo "Yangilash uchun: cd $INSTALL_DIR && bash scripts/server-deploy.sh"
  exit 0
fi

echo "1. Git orqali klonlash..."
if [ ! -d "$INSTALL_DIR" ]; then
  git clone "$REPO_URL" "$INSTALL_DIR"
else
  echo "   $INSTALL_DIR bor, klonlash o'tkazib yuborildi."
fi

echo "2. Papkaga o'tish..."
cd "$INSTALL_DIR"

echo "3. Dependency o'rnatish..."
npm ci

echo "4. Prisma generate..."
npx prisma generate

echo "5. .env faylini tekshirish..."
if [ ! -f .env ]; then
  echo "   Diqqat: .env yo'q. Serverda .env yarating va DATABASE_URL qo'shing."
  echo "   Masalan: cp .env.example .env && nano .env"
fi

echo "6. Baza yangilash (db push)..."
npx prisma db push

echo "7. Build..."
npm run build

echo "8. Eski PM2 processlarni to'xtatish (agar rash bor bo'lsa)..."
pm2 delete rash 2>/dev/null || true

echo "9. PM2 da ishga tushirish..."
pm2 start ecosystem.config.js --env production

echo ""
echo "=== Tugadi ==="
echo "Loyiha: $INSTALL_DIR"
echo "Keyingi yangilashlar uchun:"
echo "  cd $INSTALL_DIR && bash scripts/server-deploy.sh"
pm2 status
