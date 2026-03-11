#!/bin/bash
# Serverda ishlatish: cd /root/rash && bash scripts/server-tekshiruv.sh
# Loyiha qayerda ishlayotganini va build holatini tekshiradi.

echo "=========================================="
echo "1. Joriy papka va loyiha fayllari"
echo "=========================================="
pwd
ls -la package.json prisma/schema.prisma 2>/dev/null || echo "XATO: package.json yoki prisma/schema.prisma yo'q"
echo ""

echo "=========================================="
echo "2. Oxirgi commit (Git)"
echo "=========================================="
git log -1 --oneline 2>/dev/null || echo "XATO: git repo emas yoki git yo'q"
git status -s 2>/dev/null
echo ""

echo "=========================================="
echo "3. Kechikkan (lateMinutes) kodi bormi?"
echo "=========================================="
grep -l "lateMinutes\|Kechikkan" app/teacher/attendance/page.tsx 2>/dev/null && echo "HA - attendance/page.tsx da bor" || echo "YO'Q - kod topilmadi"
echo ""

echo "=========================================="
echo "4. .next build papkasi (sana)"
echo "=========================================="
ls -la .next 2>/dev/null || echo ".next yo'q - build qilinmagan"
if [ -d .next ]; then
  [ -f .next/BUILD_ID ] && echo "BUILD_ID: $(cat .next/BUILD_ID)"
  echo ".next/ yaratilgan: $(ls -ld .next | awk '{print $6, $7, $8}')"
fi
echo ""

echo "=========================================="
echo "5. PM2 – rash qayerdan ishlayapti?"
echo "=========================================="
pm2 show rash 2>/dev/null | head -25 || pm2 list
echo ""

echo "=========================================="
echo "6. Node va npm versiyalari"
echo "=========================================="
node -v
npm -v
echo ""

echo "=========================================="
echo "Tekshiruv tugadi."
echo "Agar 3-da 'YOQ' bo'lsa - git pull qiling."
echo "Agar 4-da .next yoq yoki juda eski bo'lsa - rm -rf .next && npm run build"
echo "Agar 5-da PM2 boshqa papkadan ishlayotgan bo'lsa - shu papkaga o'tib build qiling."
echo "=========================================="
