# 🔧 PM2 Working Directory (cwd) Muammosini Tuzatish

## ❌ Muammo Tavsifi

PM2 prosesni noto'g'ri working directory (cwd) dan ishga tushiryapti:
- `npm start` buyrug'i `/root/` papkasidan bajarilmoqda
- `package.json` `/var/www/rash` papkasida joylashgan
- Natija: `npm error ENOENT: Could not read package.json open '/root/package.json'`

## ✅ Yechim

### 1. PM2'ni To'liq O'chirish

```bash
# Serverga SSH orqali ulaning
ssh root@rash.uz

# PM2'ni to'xtatish va o'chirish
pm2 stop rash
pm2 delete rash
```

### 2. To'g'ri Papkaga O'tish va Git Pull

```bash
# To'g'ri papkaga o'tish
cd /var/www/rash

# Git'dan yangilanishlarni olish (ecosystem.config.js yangilanishini olish uchun)
git pull origin main
```

### 3. ecosystem.config.js Tekshirish

```bash
# ecosystem.config.js faylini tekshirish
cat ecosystem.config.js
```

Quyidagicha bo'lishi kerak:

```javascript
module.exports = {
  apps: [{
    name: 'rash',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/rash',  // ← Bu muhim! To'liq path
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

### 4. PM2'ni To'g'ri Papkadan Ishga Tushirish

**Variant A: ecosystem.config.js bilan (Tavsiya etiladi)**

```bash
# Hozirgi papka: /var/www/rash
pm2 start ecosystem.config.js
pm2 save
```

**Variant B: To'g'ridan-to'g'ri cwd parametri bilan**

```bash
# Agar ecosystem.config.js ishlamasa
pm2 start npm --name "rash" --cwd /var/www/rash -- start
pm2 save
```

### 5. Tekshirish

```bash
# Working directory tekshirish
pm2 describe rash | grep cwd
# Natija: /var/www/rash bo'lishi kerak

# Status tekshirish
pm2 status
# rash process "online" bo'lishi kerak

# Loglar tekshirish
pm2 logs rash --lines 30
# Xatoliklar bo'lmasligi kerak
# "Ready" yoki "Server started" ko'rinishi kerak
```

## 🔍 Qo'shimcha Tekshirish

### package.json Mavjudligini Tekshirish

```bash
# To'g'ri papkada package.json borligini tekshirish
cd /var/www/rash
ls -la package.json
# package.json ko'rinishi kerak
```

### PM2 Process Ma'lumotlari

```bash
# Barcha ma'lumotlarni ko'rish
pm2 describe rash

# Muhim qismlar:
# - cwd: /var/www/rash
# - status: online
# - pid: (raqam)
```

## ⚠️ Agar Hali Ham Xatolik Bo'lsa

### To'liq Qayta O'rnatish

```bash
# 1. PM2'ni to'liq o'chirish
pm2 delete rash
pm2 kill  # Barcha PM2 processlarni to'xtatish

# 2. Papkaga o'tish
cd /var/www/rash

# 3. Git pull
git pull origin main

# 4. Dependencies o'rnatish
npm ci --production=false

# 5. Prisma generate
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

### ecosystem.config.js'ni Qo'lda Tuzatish

```bash
cd /var/www/rash
nano ecosystem.config.js
```

`cwd` parametrini to'g'ri o'rnating:

```javascript
cwd: '/var/www/rash',  // To'liq absolute path
```

Keyin:
```bash
pm2 delete rash
pm2 start ecosystem.config.js
pm2 save
```

## ✅ Muvaffaqiyatli Bo'lgandan Keyin

- ✅ `pm2 describe rash | grep cwd` → `/var/www/rash`
- ✅ `pm2 status` → `rash` process `online`
- ✅ `pm2 logs rash` → xatoliklar yo'q
- ✅ https://rash.uz ishlaydi

## 📝 Eslatma

- `pm2 delete` - processni to'liq o'chirish (faqat `stop` emas)
- `pm2 save` - konfiguratsiyani saqlash (server qayta ishga tushganda avtomatik ishga tushishi uchun)
- `cwd` parametri **to'liq absolute path** bo'lishi kerak: `/var/www/rash` (`.` yoki `./` emas)
