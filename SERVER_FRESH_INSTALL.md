# 🆕 Serverda To'liq Yangi O'rnatish

Agar `/var/www/rash` papkasi bo'sh bo'lsa yoki git repository yo'q bo'lsa, quyidagi qadamlarni bajaring:

## ⚠️ MUHIM: Avval Database Backup!

```bash
# Database backup (agar mavjud bo'lsa)
mkdir -p /var/www/rash-backups
cp /var/www/rash/prisma/dev.db /var/www/rash-backups/dev.db.backup 2>/dev/null || true
```

## 🔧 To'liq Qayta O'rnatish

### Qadam 1: PM2'ni To'xtatish

```bash
pm2 stop all
pm2 delete all
```

### Qadam 2: Eski Papkani O'chirish

```bash
cd /var/www
rm -rf rash
```

### Qadam 3: Yangi Clone

```bash
git clone https://github.com/rakhmanuz/rash.git rash
cd rash
```

### Qadam 4: Environment Variables Yaratish

```bash
nano .env.local
```

Quyidagilarni qo'shing va saqlang (Ctrl+X, Y, Enter):

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="rash-secret-key-change-this-in-production"
NEXTAUTH_URL="https://rash.uz"
```

**Eslatma:** `NEXTAUTH_SECRET` uchun kuchli key yarating:
```bash
openssl rand -base64 32
```

### Qadam 5: Dependencies O'rnatish

```bash
npm install
```

### Qadam 6: Prisma Setup

```bash
npx prisma generate
npx prisma db push
```

### Qadam 7: Admin Foydalanuvchi Yaratish

```bash
node scripts/create-admin.js
```

**Login:** `admin`  
**Parol:** `admin123`

### Qadam 8: Production Build

```bash
npm run build
```

### Qadam 9: PM2 Ishga Tushirish

```bash
pm2 start npm --name "rash" -- start
pm2 save
pm2 startup
```

### Qadam 10: Tekshirish

```bash
# PM2 status
pm2 status

# Loglar
pm2 logs rash --lines 50

# Port tekshirish
netstat -tulpn | grep 3000
```

## ✅ Tezkor Komanda (Barcha Qadamlar Birga)

```bash
# PM2 to'xtatish
pm2 stop all && pm2 delete all

# Database backup
mkdir -p /var/www/rash-backups
cp /var/www/rash/prisma/dev.db /var/www/rash-backups/dev.db.backup 2>/dev/null || true

# Eski papkani o'chirish va yangi clone
cd /var/www && rm -rf rash && git clone https://github.com/rakhmanuz/rash.git rash && cd rash

# Environment variables yaratish (qo'lda)
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env.local
echo 'NEXTAUTH_SECRET="rash-secret-key-change-this-in-production"' >> .env.local
echo 'NEXTAUTH_URL="https://rash.uz"' >> .env.local

# O'rnatish
npm install && \
npx prisma generate && \
npx prisma db push && \
node scripts/create-admin.js && \
npm run build && \
pm2 start npm --name "rash" -- start && \
pm2 save
```

## 🔍 Tekshirish

```bash
# Fayllar mavjudligini tekshirish
ls -la /var/www/rash/
ls -la /var/www/rash/scripts/
ls -la /var/www/rash/package.json

# Git holatini tekshirish
cd /var/www/rash
git status
git log --oneline -5

# PM2 status
pm2 status
pm2 logs rash
```

## 🌐 Nginx Konfiguratsiya (Agar Kerak Bo'lsa)

```bash
sudo nano /etc/nginx/sites-available/rash.uz
```

Quyidagilarni qo'shing:

```nginx
server {
    listen 80;
    server_name rash.uz www.rash.uz;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Keyin:

```bash
sudo ln -s /etc/nginx/sites-available/rash.uz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL sertifikat (Let's Encrypt)
sudo certbot --nginx -d rash.uz -d www.rash.uz
```

## 🐛 Muammo Hal Qilish

### npm install xatolik?

```bash
rm -rf node_modules package-lock.json
npm install
```

### Build xatolik?

```bash
rm -rf .next
npm run build
```

### PM2 ishlamayapti?

```bash
pm2 delete rash
pm2 start npm --name "rash" -- start
pm2 save
```

### Port band?

```bash
lsof -ti:3000 | xargs kill -9
```
