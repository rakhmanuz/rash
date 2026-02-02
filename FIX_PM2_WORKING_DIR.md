# 🔧 PM2 Working Directory Muammosini Tuzatish

## ❌ Muammo

PM2 hali ham `/root/` papkasidan ishga tushirilmoqda va `package.json` topilmayapti.

## ✅ Yechim

Serverga SSH orqali ulaning va quyidagi buyruqlarni bajaring:

```bash
# 1. Serverga ulanish
ssh root@rash.uz

# 2. PM2'ni to'xtatish va o'chirish
pm2 stop rash
pm2 delete rash

# 3. To'g'ri papkaga o'tish
cd /var/www/rash

# 4. Git'dan yangilanishlarni olish (ecosystem.config.js yangilanishini olish uchun)
git pull origin main

# 5. ecosystem.config.js faylini tekshirish
cat ecosystem.config.js
# cwd: '/var/www/rash' bo'lishi kerak

# 6. PM2'ni ecosystem config bilan ishga tushirish
pm2 start ecosystem.config.js

# 7. PM2'ni saqlash
pm2 save

# 8. Status tekshirish
pm2 status

# 9. Working directory tekshirish
pm2 describe rash | grep cwd
# /var/www/rash ko'rsatishi kerak

# 10. Loglar tekshirish
pm2 logs rash --lines 30
```

## 🔍 Agar Hali Ham Xatolik Bo'lsa

### Variant 1: To'g'ridan-to'g'ri PM2 start

```bash
cd /var/www/rash
pm2 delete rash
pm2 start npm --name "rash" --cwd /var/www/rash -- start
pm2 save
pm2 status
```

### Variant 2: ecosystem.config.js'ni qo'lda tekshirish va tuzatish

```bash
cd /var/www/rash
nano ecosystem.config.js
```

Quyidagicha bo'lishi kerak:

```javascript
module.exports = {
  apps: [{
    name: 'rash',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/rash',  // ← Bu muhim!
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
pm2 delete rash
pm2 start ecosystem.config.js
pm2 save
```

### Variant 3: To'liq qayta o'rnatish

```bash
# 1. PM2'ni to'xtatish
pm2 stop rash
pm2 delete rash

# 2. Papkaga o'tish
cd /var/www/rash

# 3. Git pull
git pull origin main

# 4. Dependencies
npm ci --production=false

# 5. Prisma
npx prisma generate

# 6. Build
npm run build

# 7. PM2'ni ishga tushirish
pm2 start ecosystem.config.js
pm2 save

# 8. Tekshirish
pm2 status
pm2 logs rash --lines 30
```

## ✅ Muvaffaqiyatli Bo'lgandan Keyin

- ✅ `pm2 describe rash | grep cwd` → `/var/www/rash` ko'rsatishi kerak
- ✅ `pm2 status` → `rash` process `online` bo'lishi kerak
- ✅ `pm2 logs rash` → xatoliklar bo'lmasligi kerak
- ✅ https://rash.uz ishlashi kerak
