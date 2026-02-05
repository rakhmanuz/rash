#!/bin/bash

# Serverda .env faylini yaratish scripti

echo "🔧 Serverda .env faylini sozlash..."
echo ""

ENV_FILE="/var/www/rash/.env"

# .env faylini yaratish
cat > "$ENV_FILE" << 'EOF'
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="https://rash.uz"
NEXTAUTH_SECRET="ddCG/kKTGw1z3HGa5O/7lbCD/khMlZ2Yd/ZAQv2uME8="

# Telegram Bot
TELEGRAM_BOT_TOKEN="8510849426:AAGmpWgTp5aziP0qy28ntDoN8ferOZ6iKsE"
TELEGRAM_ADMIN_ID="1020793818"
EOF

# Fayl huquqlarini sozlash
chmod 600 "$ENV_FILE"

echo "✅ .env fayl yaratildi: $ENV_FILE"
echo ""
echo "📋 Fayl tarkibi:"
cat "$ENV_FILE"
echo ""
echo "✅ Tugallandi!"
