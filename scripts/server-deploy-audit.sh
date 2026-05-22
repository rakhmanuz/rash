#!/bin/bash
# Serverda: bash scripts/server-deploy-audit.sh
# Natijani nusxalab yuboring — deploy rejasini shunga qarab tuzatamiz.

set +e
echo "========== SERVER AUDIT $(date -Iseconds) =========="
echo "HOST: $(hostname)"
echo "USER: $(whoami)"
echo ""

echo "=== 1. Loyiha papkalari ==="
for d in /var/www/rash /root/rash; do
  if [ -f "$d/package.json" ]; then
    echo "OK $d"
    ls -la "$d/package.json" "$d/ecosystem.config.js" 2>/dev/null
  else
    echo "YOQ $d"
  fi
done
echo ""

echo "=== 2. PM2 rash ==="
pm2 show rash 2>/dev/null | grep -E 'exec cwd|status|script path|NODE_ENV|restarts' || pm2 list
echo ""

echo "=== 3. Joriy papka (agar PM2 cwd bo'lsa) ==="
CWD=$(pm2 show rash 2>/dev/null | awk -F'│' '/exec cwd/{gsub(/ /,"",$3); print $3; exit}')
if [ -n "$CWD" ] && [ -f "$CWD/package.json" ]; then
  cd "$CWD" || exit 1
  echo "PM2 cwd: $CWD"
else
  if [ -f /var/www/rash/package.json ]; then cd /var/www/rash
  elif [ -f /root/rash/package.json ]; then cd /root/rash
  else echo "Loyiha topilmadi"; exit 1
  fi
  echo "PM2 cwd aniqlanmadi, taxmin: $(pwd)"
fi
pwd
echo ""

echo "=== 4. Git ==="
git remote -v 2>/dev/null | head -2
git branch -v 2>/dev/null
git log -1 --format='%h %ci %s' 2>/dev/null
echo "Local o'zgarishlar:"
git status -s 2>/dev/null | head -20
echo ""

echo "=== 5. Muhim fayllar (yangi funksiyalar) ==="
for f in \
  lib/uzbekistan-time.ts \
  lib/student-legacy-paths.ts \
  app/api/student/offline-lessons/route.ts \
  app/student-offline/lessons/page.tsx \
  lib/activity-log.ts \
  prisma/schema.prisma; do
  if [ -f "$f" ]; then echo "  OK $f"; else echo "  YOQ $f"; fi
done
echo ""

echo "=== 6. .env (maxfiy emas — faqat kalitlar bormi) ==="
if [ -f .env ]; then
  grep -E '^[A-Z_]+=' .env | sed 's/=.*/=***/' | head -25
else
  echo ".env YOQ"
fi
echo ""

echo "=== 7. Baza ==="
ls -la prisma/*.db 2>/dev/null || echo "prisma/*.db yo'q"
if [ -f prisma/dev.db ]; then du -h prisma/dev.db; fi
echo "ActivityLog model:"
grep -c 'model ActivityLog' prisma/schema.prisma 2>/dev/null || echo "0"
echo ""

echo "=== 8. Build ==="
if [ -d .next ]; then
  ls -ld .next
  [ -f .next/BUILD_ID ] && echo "BUILD_ID=$(cat .next/BUILD_ID)"
else
  echo ".next yo'q"
fi
echo ""

echo "=== 9. Node ==="
node -v
npm -v
echo ""

echo "=== 10. Sayt (localhost:3000) ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/ 2>/dev/null || echo "curl xato"
echo ""
echo "========== AUDIT TUGADI =========="
