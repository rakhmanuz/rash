# Serverga To'liq Deploy Qilish

## Muammo:
Localhost'da ishlayapti, lekin serverda to'liq ishlamayapti.

## Yechim - Qadam-baqadam:

### 1. Serverga SSH orqali kirish:
```bash
ssh root@rash.uz
```

### 2. Project folder'ga o'tish:
```bash
cd /var/www/rash
```

### 3. Deploy script'ni executable qilish:
```bash
chmod +x deploy-to-server.sh
```

### 4. Deploy script'ni ishga tushirish (avtomatik barcha ishlarni bajaradi):
```bash
./deploy-to-server.sh
```

Yoki qo'lda quyidagilarni bajaring:

### Qo'lda Deploy:

```bash
# 1. PM2'ni to'xtatish
pm2 stop rash

# 2. Eski build'ni tozalash
rm -rf .next
rm -rf node_modules/.cache

# 3. Git'dan yangi kodlarni olish
git pull origin main

# 4. Node modules'ni o'rnatish
npm install

# 5. Prisma generate
npx prisma generate

# 6. Database migration (agar kerak bo'lsa)
npx prisma db push --skip-generate

# 7. MUHIM: Production build qilish
npm run build

# 8. Build muvaffaqiyatli bo'lganda tekshirish
ls -la .next

# 9. Environment variables'ni tekshirish
cat .env.local | grep NEXTAUTH

# 10. PM2'ni qayta ishga tushirish
pm2 restart rash

# 11. Statusni tekshirish
pm2 status

# 12. Loglarni tekshirish
pm2 logs rash --lines 20
```

## Environment Variables Tekshirish:

```bash
# .env.local faylini tekshirish
cat .env.local

# Agar yo'q bo'lsa, yaratish:
nano .env.local
```

**Quyidagilarni qo'shing:**
```
NEXTAUTH_URL=https://rash.uz
NEXTAUTH_SECRET=<secret-key-32-chars-or-more>
NODE_ENV=production
DATABASE_URL="file:./dev.db"
```

**NEXTAUTH_SECRET yaratish:**
```bash
openssl rand -base64 32
```

## Agar Build Xatolik Bersa:

### A) Memory muammosi:
```bash
# Swap memory qo'shish
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### B) Node modules muammosi:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### C) Prisma muammosi:
```bash
npx prisma generate
npx prisma db push
npm run build
```

## Tekshirish:

1. **Build muvaffaqiyatli bo'lganda:**
   - `.next` folder yaratilgan bo'lishi kerak
   - `prerender-manifest.json` fayli mavjud bo'lishi kerak

2. **PM2 status:**
   ```bash
   pm2 status
   ```
   - Status `online` bo'lishi kerak

3. **Loglar:**
   ```bash
   pm2 logs rash --lines 20
   ```
   - Xatolik bo'lmasligi kerak

4. **Sayt:**
   - Browser'dan `https://rash.uz` ni ochish
   - Login qilish va admin paneliga kirish

## Muammo Hal Bo'lmasa:

1. **Browser'dan cookie'larni tozalash**
2. **Server loglarini to'liq ko'rish:**
   ```bash
   pm2 logs rash --lines 50
   ```

3. **Database'ni tekshirish:**
   ```bash
   sqlite3 dev.db "SELECT id, username, role FROM User WHERE role='ADMIN' LIMIT 5;"
   ```

4. **Nginx loglarini tekshirish:**
   ```bash
   tail -f /var/log/nginx/error.log
   ```
