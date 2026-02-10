# Bot Xatoliklarni Tekshirish va Tuzatish

## 🔍 Xatoliklarni Ko'rish

### 1. PM2 Loglarini Ko'rish

#### Oxirgi 50 qator loglar:
```bash
pm2 logs rash --lines 50
```

#### Faqat xatoliklar:
```bash
pm2 logs rash --err --lines 50
```

#### Faqat output (muvaffaqiyatli xabarlar):
```bash
pm2 logs rash --out --lines 50
```

#### Real-time loglar (to'xtatish uchun Ctrl+C):
```bash
pm2 logs rash
```

### 2. PM2 Status

```bash
pm2 status
```

Bu quyidagilarni ko'rsatadi:
- Process status (online/offline)
- CPU va Memory foydalanish
- Restart count

### 3. PM2 Log Fayllarini To'g'ridan-to'g'ri Ko'rish

```bash
# Error log
tail -50 /root/.pm2/logs/rash-error.log

# Output log
tail -50 /root/.pm2/logs/rash-out.log

# Yoki cat orqali
cat /root/.pm2/logs/rash-error.log
```

### 4. Next.js Build Xatoliklari

```bash
cd /var/www/rash
npm run build
```

### 5. Telegram Bot Webhook Tekshirish

```bash
curl "https://api.telegram.org/bot8369765741:AAH7vS3X1z-Ul391bwNYP-c5G6zgHL2j5gc/getWebhookInfo"
```

## 🔧 Bot'ni Qayta Ishga Tushirish

### 1. PM2 Restart

```bash
pm2 restart rash
```

### 2. PM2 Stop va Start

```bash
pm2 stop rash
pm2 start ecosystem.config.js
```

### 3. To'liq Qayta Ishga Tushirish

```bash
pm2 delete rash
pm2 start ecosystem.config.js
pm2 save
```

### 4. Loglarni Tozalash va Restart

```bash
pm2 flush rash
pm2 restart rash
```

## 🐛 Keng Tarqalgan Xatoliklar

### Xatolik: "Bot is not responding"

**Yechim:**
```bash
# Webhook'ni tekshirish
curl "https://api.telegram.org/bot8369765741:AAH7vS3X1z-Ul391bwNYP-c5G6zgHL2j5gc/getWebhookInfo"

# Webhook'ni qayta sozlash
curl -X POST "https://api.telegram.org/bot8369765741:AAH7vS3X1z-Ul391bwNYP-c5G6zgHL2j5gc/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://rash.uz/api/telegram/student-bot"}'

# PM2 restart
pm2 restart rash
```

### Xatolik: "Process crashed"

**Yechim:**
```bash
# Loglarni ko'rish
pm2 logs rash --err --lines 100

# To'liq qayta ishga tushirish
pm2 delete rash
cd /var/www/rash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

### Xatolik: "Module not found"

**Yechim:**
```bash
cd /var/www/rash
npm ci
npx prisma generate
npm run build
pm2 restart rash
```

### Xatolik: "Database connection error"

**Yechim:**
```bash
cd /var/www/rash
npx prisma generate
npx prisma db push
pm2 restart rash
```

## 📊 Tezkor Tekshirish Skripti

```bash
cd /var/www/rash
bash scripts/check-bot-status.sh
```

## 🔄 Avtomatik Restart (Agar Bot To'xtasa)

PM2 avtomatik restart qiladi, lekin agar muammo bo'lsa:

```bash
# PM2 config'ni tekshirish
cat ecosystem.config.js

# Autorestart yoqilganligini tekshirish
pm2 describe rash
```

## 📝 Log Fayllari Joylashuvi

- **Error logs:** `/root/.pm2/logs/rash-error.log`
- **Output logs:** `/root/.pm2/logs/rash-out.log`
- **PM2 daemon logs:** `/root/.pm2/pm2.log`

## 🚨 Favqulodda Vaziyat

Agar bot umuman ishlamasa:

```bash
# 1. PM2'ni to'xtatish
pm2 stop all
pm2 delete all

# 2. Port'ni tekshirish
lsof -i :3000
# Agar process bor bo'lsa, o'chirish:
kill -9 PID

# 3. To'liq qayta ishga tushirish
cd /var/www/rash
git pull origin main
npm ci
npx prisma generate
npm run build
pm2 start ecosystem.config.js
pm2 save

# 4. Tekshirish
pm2 status
pm2 logs rash --lines 20
```
