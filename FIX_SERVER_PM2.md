# 🔧 Server PM2 va NextAuth Muammolarini Tuzatish

## ❌ Muammolar

1. **PM2 noto'g'ri papkadan ishga tushirilgan** - `/root/` o'rniga `/var/www/rash/`
2. **NextAuth JWT decryption xatoligi** - `NEXTAUTH_SECRET` muammosi

## ✅ Yechim

### 1. PM2'ni To'g'ri Papkadan Ishga Tushirish

```bash
# Serverga SSH orqali ulaning
ssh root@rash.uz

# 1. Hozirgi PM2 processni o'chirish
pm2 delete rash

# 2. To'g'ri papkaga o'tish
cd /var/www/rash

# 3. PM2 ecosystem config'ni tekshirish
cat ecosystem.config.js

# 4. PM2'ni ecosystem config bilan ishga tushirish
pm2 start ecosystem.config.js

# yoki agar ecosystem.config.js bo'lmasa:
pm2 start npm --name "rash" --cwd /var/www/rash -- start

# 5. PM2'ni saqlash
pm2 save

# 6. PM2 startup (server qayta ishga tushganda avtomatik ishga tushishi uchun)
pm2 startup
```

### 2. NextAuth Secret Muammosini Tuzatish

```bash
# 1. Server papkasiga o'tish
cd /var/www/rash

# 2. .env.local faylini tekshirish
cat .env.local

# 3. Agar NEXTAUTH_SECRET yo'q bo'lsa yoki noto'g'ri bo'lsa:
# Yangi secret yaratish
openssl rand -base64 32

# 4. .env.local faylini tahrirlash
nano .env.local
```

`.env.local` faylida quyidagilar bo'lishi kerak:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="yangi-yaratilgan-secret-key-bu-yerga"
NEXTAUTH_URL="https://rash.uz"
```

### 3. To'liq Qayta O'rnatish

```bash
# 1. Server papkasiga o'tish
cd /var/www/rash

# 2. PM2'ni to'xtatish va o'chirish
pm2 stop rash
pm2 delete rash

# 3. Git'dan yangilanishlarni olish
git fetch origin
git reset --hard origin/main
git pull origin main

# 4. Environment variables tekshirish
cat .env.local

# 5. Agar NEXTAUTH_SECRET yo'q bo'lsa, yangi yaratish
NEW_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=$NEW_SECRET" >> .env.local

# 6. Dependencies o'rnatish
npm ci --production=false

# 7. Prisma generate
npx prisma generate

# 8. Database schema push
npx prisma db push --accept-data-loss || true

# 9. Build cache tozalash
rm -rf .next
rm -rf node_modules/.cache

# 10. Production build
npm run build

# 11. PM2'ni to'g'ri papkadan ishga tushirish
cd /var/www/rash
pm2 start ecosystem.config.js
# yoki
pm2 start npm --name "rash" --cwd /var/www/rash -- start

# 12. PM2'ni saqlash
pm2 save

# 13. Status tekshirish
pm2 status
pm2 logs rash --lines 50
```

### 4. Ecosystem Config'ni Yangilash

`ecosystem.config.js` faylini tekshiring va quyidagicha bo'lishi kerak:

```javascript
module.exports = {
  apps: [{
    name: 'rash',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/rash',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/root/.pm2/logs/rash-error.log',
    out_file: '/root/.pm2/logs/rash-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
```

### 5. Tekshirish

```bash
# PM2 status
pm2 status

# PM2 logs
pm2 logs rash --lines 50

# Process ma'lumotlari
pm2 describe rash

# Working directory tekshirish
pm2 describe rash | grep "cwd"
```

## 🔍 Muammolarni Tuzatish

### Agar hali ham xatolik bo'lsa:

1. **Port tekshirish:**
   ```bash
   lsof -i :3000
   # Agar port band bo'lsa:
   kill -9 $(lsof -ti:3000)
   ```

2. **PM2'ni to'liq qayta ishga tushirish:**
   ```bash
   pm2 kill
   pm2 resurrect
   ```

3. **Environment variables tekshirish:**
   ```bash
   cd /var/www/rash
   cat .env.local
   # Barcha kerakli o'zgaruvchilar bo'lishi kerak
   ```

4. **Build tekshirish:**
   ```bash
   cd /var/www/rash
   ls -la .next
   # .next papkasi mavjud bo'lishi kerak
   ```

## ✅ Muvaffaqiyatli Bo'lgandan Keyin

- PM2 status `online` bo'lishi kerak
- Loglarda xatolik bo'lmasligi kerak
- https://rash.uz ishlashi kerak
- Login sahifasi to'g'ri ishlashi kerak
