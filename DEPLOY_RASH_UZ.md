# 🚀 Rash.uz Serverga Yuklash Ko'rsatmasi

Bu ko'rsatma rash.uz domeni uchun production serverga yuklash uchun.

## 📋 Talablar

- SSH access serverga
- Git repository'ga access
- Node.js va npm o'rnatilgan
- PM2 o'rnatilgan
- Prisma o'rnatilgan

## 🔧 Serverga SSH orqali Ulanish

```bash
ssh root@rash.uz
# yoki
ssh username@rash.uz
```

## 📦 Birinchi O'rnatish (Agar birinchi marta bo'lsa)

### 1. Papka yaratish va Git clone

```bash
cd /var/www
git clone https://github.com/rakhmanuz/rash.git rash
cd rash
```

### 2. Environment variables yaratish

```bash
nano .env.local
```

Quyidagilarni qo'shing:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://rash.uz"
```

Secret key yaratish:
```bash
openssl rand -base64 32
```

### 3. Dependencies o'rnatish

```bash
npm install
```

### 4. Prisma setup

```bash
npx prisma generate
npx prisma db push
```

### 5. Admin foydalanuvchi yaratish

```bash
node scripts/create-admin.js
```

### 6. Production build

```bash
npm run build
```

### 7. PM2 ishga tushirish

```bash
pm2 start npm --name "rash" -- start
pm2 save
pm2 startup
```

## 🔄 Yangilash (Har safar yangi kod yuklanganda)

### Variant 1: Script ishlatish (Tavsiya etiladi)

```bash
cd /var/www/rash
chmod +x scripts/deploy-to-rash-uz.sh
./scripts/deploy-to-rash-uz.sh
```

### Variant 2: Qo'lda

```bash
cd /var/www/rash

# PM2'ni to'xtatish
pm2 stop rash

# Git yangilash
git pull origin main

# Dependencies
npm ci

# Prisma
npx prisma generate
npx prisma db push

# Build
rm -rf .next
npm run build

# PM2 restart
pm2 restart rash
pm2 save
```

## 🔍 Tekshirish

### PM2 status

```bash
pm2 status
pm2 logs rash --lines 50
```

### Port tekshirish

```bash
netstat -tulpn | grep 3000
# yoki
lsof -i :3000
```

### Nginx konfiguratsiya (agar ishlatilsa)

```bash
# Nginx config
sudo nano /etc/nginx/sites-available/rash.uz
```

Nginx config misoli:

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

SSL sertifikat (Let's Encrypt):

```bash
sudo certbot --nginx -d rash.uz -d www.rash.uz
```

## 🐛 Muammo Hal Qilish

### Build xatolik?

```bash
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### Database xatolik?

```bash
npx prisma generate
npx prisma db push
```

### PM2 ishlamayapti?

```bash
pm2 delete rash
pm2 start npm --name "rash" -- start
pm2 save
```

### Port band?

```bash
# Port 3000'dagi jarayonni o'ldirish
lsof -ti:3000 | xargs kill -9
# yoki
fuser -k 3000/tcp
```

### Loglarni ko'rish

```bash
pm2 logs rash
# yoki
pm2 logs rash --lines 100
```

## 📝 Muhim Eslatmalar

1. **Database backup** - Har safar yangilashdan oldin database'ni backup qiling
2. **Environment variables** - `.env.local` faylini saqlab qoling
3. **Git pull** - Har safar `git pull` qilishdan oldin tekshiring
4. **Build** - Har safar `npm run build` qilish kerak
5. **PM2** - Har safar `pm2 restart rash` qilish kerak

## 🔐 Xavfsizlik

1. **NEXTAUTH_SECRET** - Kuchli secret key ishlating
2. **Database** - Production'da PostgreSQL ishlatish tavsiya etiladi
3. **HTTPS** - SSL sertifikat o'rnatish kerak
4. **Firewall** - Faqat kerakli portlarni oching

## 📞 Yordam

Agar muammo bo'lsa:
1. `pm2 logs rash` - Loglarni ko'ring
2. `pm2 status` - Statusni tekshiring
3. `npm run build` - Build'ni qayta qiling
