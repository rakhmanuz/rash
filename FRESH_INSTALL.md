# Serverdan To'liq O'chirib Qayta Yuklash

## ⚠ EHTIYOT:
Bu jarayon **barcha fayllarni o'chiradi** va saytni qaytadan yuklaydi. Database (dev.db) saqlanadi, lekin boshqa hamma narsa o'chadi.

## Qadam-baqadam:

### 1. Serverga SSH orqali kirish:
```bash
ssh root@rash.uz
```

### 2. Project folder'ga o'tish:
```bash
cd /var/www/rash
```

### 3. Database'ni backup qilish (MUHIM!):
```bash
# Database'ni backup qilish
cp dev.db dev.db.backup.$(date +%Y%m%d_%H%M%S)

# Backup'ni tekshirish
ls -la dev.db.backup.*
```

### 4. Fresh install script'ni yuklab olish:
```bash
# Git'dan yangi script'ni olish
git pull origin main

# Script'ni executable qilish
chmod +x fresh-install.sh
```

### 5. Fresh install script'ni ishga tushirish:
```bash
./fresh-install.sh
```

Script avtomatik ravishda:
- PM2'ni to'xtatadi va o'chiradi
- Database'ni backup qiladi
- Barcha fayllarni o'chiradi (database'dan tashqari)
- Git'dan yangi kodlarni yuklaydi
- Node modules'ni o'rnatadi
- Prisma generate qiladi
- Database migration qiladi
- Environment variables'ni sozlaydi
- Production build qiladi
- PM2'ni qayta ishga tushiradi

## Yoki Qo'lda:

### 1. PM2'ni to'xtatish va o'chirish:
```bash
pm2 stop rash
pm2 delete rash
```

### 2. Database'ni backup qilish:
```bash
cp dev.db dev.db.backup.$(date +%Y%m%d_%H%M%S)
```

### 3. Barcha fayllarni o'chirish (database'dan tashqari):
```bash
cd /var/www/rash
find . -mindepth 1 -maxdepth 1 ! -name 'dev.db*' ! -name '*.backup.*' -exec rm -rf {} +
```

### 4. Git'dan yangi kodlarni clone qilish:
```bash
git clone https://github.com/rakhmanuz/rash.git temp_rash
mv temp_rash/* temp_rash/.* . 2>/dev/null || true
rmdir temp_rash
```

### 5. Node modules'ni o'rnatish:
```bash
npm install
```

### 6. Prisma generate:
```bash
npx prisma generate
```

### 7. Database migration:
```bash
npx prisma db push --skip-generate
```

### 8. Environment variables'ni yaratish:
```bash
# NEXTAUTH_SECRET yaratish
SECRET=$(openssl rand -base64 32)

# .env.local yaratish
cat > .env.local << EOF
NEXTAUTH_URL=https://rash.uz
NEXTAUTH_SECRET=$SECRET
NODE_ENV=production
DATABASE_URL="file:./dev.db"
EOF
```

### 9. Production build:
```bash
npm run build
```

### 10. Logs folder'ni yaratish:
```bash
mkdir -p logs
```

### 11. PM2'ni qayta ishga tushirish:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
```

### 12. Statusni tekshirish:
```bash
pm2 status
pm2 logs rash --lines 20
```

## Tekshirish:

1. **Build muvaffaqiyatli bo'lganda:**
   ```bash
   ls -la .next
   ```
   - `.next` folder mavjud bo'lishi kerak

2. **PM2 status:**
   ```bash
   pm2 status
   ```
   - Status `online` bo'lishi kerak

3. **Environment variables:**
   ```bash
   cat .env.local
   ```
   - Barcha kerakli variables mavjud bo'lishi kerak

4. **Sayt:**
   - Browser'dan `https://rash.uz` ni ochish
   - Login qilish va test qilish

## Muammo Hal Bo'lmasa:

1. **Loglarni ko'rish:**
   ```bash
   pm2 logs rash --lines 50
   ```

2. **Database'ni tekshirish:**
   ```bash
   sqlite3 dev.db "SELECT COUNT(*) FROM User;"
   ```

3. **Nginx loglarini tekshirish:**
   ```bash
   tail -f /var/log/nginx/error.log
   ```

4. **Backup'dan qayta tiklash (agar kerak bo'lsa):**
   ```bash
   cp dev.db.backup.* dev.db
   ```
