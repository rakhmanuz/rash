# Serverda .env Faylini Sozlash

## 🚀 Tezkor Sozlash

### Variant 1: Script orqali (Tavsiya etiladi)

Serverga SSH orqali ulaning va quyidagi scriptni ishga tushiring:

```bash
cd /var/www/rash
bash setup-server-env.sh
```

Yoki to'g'ridan-to'g'ri:

```bash
bash <(curl -s https://raw.githubusercontent.com/your-repo/setup-server-env.sh)
```

### Variant 2: Bitta Buyruq

Serverda quyidagi buyruqni ishga tushiring:

```bash
cat > /var/www/rash/.env << 'EOF'
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="https://rash.uz"
NEXTAUTH_SECRET="ddCG/kKTGw1z3HGa5O/7lbCD/khMlZ2Yd/ZAQv2uME8="

# Telegram Bot
TELEGRAM_BOT_TOKEN="8510849426:AAGmpWgTp5aziP0qy28ntDoN8ferOZ6iKsE"
TELEGRAM_ADMIN_ID="1020793818"
EOF

chmod 600 /var/www/rash/.env
```

### Variant 3: Echo orqali (Qisqa)

```bash
echo 'DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="https://rash.uz"
NEXTAUTH_SECRET="ddCG/kKTGw1z3HGa5O/7lbCD/khMlZ2Yd/ZAQv2uME8="
TELEGRAM_BOT_TOKEN="8510849426:AAGmpWgTp5aziP0qy28ntDoN8ferOZ6iKsE"
TELEGRAM_ADMIN_ID="1020793818"' > /var/www/rash/.env && chmod 600 /var/www/rash/.env
```

## ✅ Tekshirish

Fayl yaratilganligini tekshirish:

```bash
cat /var/www/rash/.env
```

Yoki:

```bash
ls -la /var/www/rash/.env
```

## 🔄 Avtomatik Sozlash

`DEPLOY_TO_SERVER.sh` scripti endi avtomatik `.env` faylini yaratadi va Telegram bot sozlamalarini qo'shadi.

## 📋 .env Fayl Tarkibi

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="https://rash.uz"
NEXTAUTH_SECRET="ddCG/kKTGw1z3HGa5O/7lbCD/khMlZ2Yd/ZAQv2uME8="

# Telegram Bot
TELEGRAM_BOT_TOKEN="8510849426:AAGmpWgTp5aziP0qy28ntDoN8ferOZ6iKsE"
TELEGRAM_ADMIN_ID="1020793818"
```

## 🔐 Xavfsizlik

- `.env` fayl faqat root va web server foydalanuvchisi o'qishi mumkin (`chmod 600`)
- Token va secret'lar hech qachon public repository'ga qo'yilmasligi kerak
- Production'da `.env` fayl `.gitignore` da bo'lishi kerak
