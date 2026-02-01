# Serverga Build va Deploy Qilish

## Muammo:
Serverda `.next` folder yo'q yoki to'liq emas. Bu sababli application ishlamayapti.

## Yechim:

### 1. Serverga kirish va build qilish:

```bash
# Serverga SSH orqali kirish
ssh root@rash.uz

# Project folder'ga o'tish
cd /var/www/rash

# Git'dan yangi kodlarni olish
git pull

# Node modules'ni o'rnatish (agar kerak bo'lsa)
npm install

# Production build qilish
npm run build

# PM2'ni restart qilish
pm2 restart rash

# Loglarni tekshirish
pm2 logs rash --lines 20
```

### 2. Agar build xatolik bersa:

```bash
# .next folder'ni tozalash
rm -rf .next

# Qayta build qilish
npm run build

# PM2'ni restart qilish
pm2 restart rash
```

### 3. Agar hali ham muammo bo'lsa:

```bash
# PM2'ni to'xtatish
pm2 stop rash

# .next va node_modules'ni tozalash
rm -rf .next node_modules

# Qayta o'rnatish
npm install
npm run build

# PM2'ni qayta ishga tushirish
pm2 start ecosystem.config.js --env production
# yoki
pm2 restart rash
```

### 4. Build muvaffaqiyatli bo'lgandan keyin:

```bash
# Build muvaffaqiyatli bo'ldi deb ko'rsatadi
# Keyin PM2'ni restart qilish
pm2 restart rash

# Statusni tekshirish
pm2 status

# Loglarni kuzatish
pm2 logs rash
```
