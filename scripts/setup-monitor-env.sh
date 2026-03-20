#!/bin/bash
# Serverda ishlatish: cd /var/www/rash && bash scripts/setup-monitor-env.sh
# .env ga MONITOR_LOGIN va MONITOR_PASSWORD qo'shadi (yo'q bo'lsa)

set -e
ENV_FILE="${ENV_FILE:-.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "⚠️  .env topilmadi. Avval .env yarating (masalan: cp .env.example .env)"
  exit 1
fi

if grep -q "^MONITOR_LOGIN=" "$ENV_FILE" 2>/dev/null; then
  echo "✅ MONITOR_LOGIN allaqachon .env da mavjud."
  grep "^MONITOR_LOGIN=" "$ENV_FILE" || true
  echo "Parolni o'zgartirish uchun: nano $ENV_FILE va MONITOR_PASSWORD=... ni tahrirlang."
  exit 0
fi

echo ""
echo "Monitor panel uchun login/parol .env ga qo'shilmoqda..."
echo "Default: login=monitor, parol=monitor123 (serverda parolni o'zgartiring!)"
echo ""

echo "" >> "$ENV_FILE"
echo "# Monitor panel (/monitor) - login/parol" >> "$ENV_FILE"
echo "MONITOR_LOGIN=monitor" >> "$ENV_FILE"
echo "MONITOR_PASSWORD=monitor123" >> "$ENV_FILE"
echo ""
echo "✅ Qo'shildi: MONITOR_LOGIN=monitor, MONITOR_PASSWORD=monitor123"
echo "⚠️  Serverda parolni o'zgartiring: nano $ENV_FILE → MONITOR_PASSWORD=... ni yangilang"
echo ""
