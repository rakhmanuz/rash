# 🔧 PM2 Working Directory Muammosini Tezkor Tuzatish

## ❌ Muammo

PM2 hali ham `/root/` papkasidan ishga tushirilmoqda va `package.json` topilmayapti.

## ✅ Tezkor Yechim

Serverga SSH orqali ulaning va quyidagi buyruqlarni **ketma-ket** bajaring:

```bash
# 1. PM2'ni to'liq o'chirish
pm2 delete rash

# 2. To'g'ri papkaga o'tish
cd /var/www/rash

# 3. Git'dan yangilanishlarni olish
git pull origin main

# 4. ecosystem.config.js faylini tekshirish
cat ecosystem.config.js | grep cwd
# cwd: '/var/www/rash' ko'rsatishi kerak

# 5. PM2'ni to'g'ri papkadan ishga tushirish (2 ta variant)

# Variant A: ecosystem.config.js bilan
pm2 start ecosystem.config.js

# YOKI Variant B: To'g'ridan-to'g'ri cwd bilan
# pm2 start npm --name "rash" --cwd /var/www/rash -- start

# 6. PM2'ni saqlash
pm2 save

# 7. Working directory tekshirish
pm2 describe rash | grep cwd
# /var/www/rash ko'rsatishi kerak

# 8. Status tekshirish
pm2 status

# 9. Loglar tekshirish
pm2 logs rash --lines 20
```

## 🔍 Agar Hali Ham Xatolik Bo'lsa

### To'liq Qayta O'rnatish

```bash
# 1. PM2'ni o'chirish
pm2 delete rash
pm2 kill  # Barcha PM2 processlarni to'xtatish

# 2. Papkaga o'tish
cd /var/www/rash

# 3. Git pull
git pull origin main

# 4. ecosystem.config.js'ni qo'lda tekshirish va tuzatish
nano ecosystem.config.js
```

`ecosystem.config.js` faylida quyidagilar bo'lishi kerak:

```javascript
module.exports = {
  apps: [{
    name: 'rash',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/rash',  // ← Bu muhim! To'liq path bo'lishi kerak
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/root/.pm2/logs/rash-error.log',
    out_file: '/root/.pm2/logs/rash-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
```

Keyin:
```bash
# 5. PM2'ni qayta ishga tushirish
pm2 start ecosystem.config.js
pm2 save

# 6. Tekshirish
pm2 describe rash
pm2 logs rash --lines 30
```

### Yoki To'g'ridan-to'g'ri Start

```bash
cd /var/www/rash
pm2 delete rash
pm2 start npm --name "rash" --cwd /var/www/rash -- start
pm2 save
pm2 status
```

## ✅ Muvaffaqiyatli Bo'lgandan Keyin

```bash
# Working directory tekshirish
pm2 describe rash | grep cwd
# Natija: /var/www/rash bo'lishi kerak

# Status
pm2 status
# rash process "online" bo'lishi kerak

# Loglar
pm2 logs rash --lines 30
# Xatoliklar bo'lmasligi kerak, faqat "Ready" yoki "Server started" ko'rinishi kerak
```

## 🚨 Muhim Eslatma

- `pm2 delete rash` - processni to'liq o'chirish
- `pm2 stop rash` - faqat to'xtatish (o'chirmaydi)
- `pm2 save` - konfiguratsiyani saqlash (server qayta ishga tushganda avtomatik ishga tushishi uchun)
- `cwd` parametri **to'liq path** bo'lishi kerak: `/var/www/rash` (`.` yoki `./` emas)
