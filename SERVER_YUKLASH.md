# 🚀 Rash.uz Serverga Yuklash Qo'llanmasi

## 📋 Tarkib

1. [Birinchi marta yuklash](#birinchi-marta-yuklash)
2. [Keyingi yangilanishlar](#keyingi-yangilanishlar)
3. [Muhim sozlamalar](#muhim-sozlamalar)
4. [Muammolarni hal qilish](#muammolarni-hal-qilish)

---

## 🎯 Birinchi marta yuklash

### Qadam 1: Local'da kodni Git'ga push qilish

**Windows PowerShell'da:**

```powershell
cd C:\IQMax

# O'zgarishlarni ko'rish
git status

# Barcha o'zgarishlarni qo'shish
git add -A

# Commit qilish
git commit -m "Production deployment"

# Git'ga push qilish
git push
```

### Qadam 2: VPS'ga SSH orqali ulanish

```bash
ssh root@rash.uz
# yoki
ssh root@VPS_IP_ADDRESS
```

### Qadam 3: VPS'da kerakli dasturlarni o'rnatish

```bash
# Node.js va npm o'rnatish (agar yo'q bo'lsa)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 o'rnatish
sudo npm install -g pm2

# Git o'rnatish (agar yo'q bo'lsa)
sudo apt-get install -y git

# Nginx o'rnatish
sudo apt-get install -y nginx
```

### Qadam 4: Loyiha papkasini yaratish va kodni yuklash

```bash
# Papka yaratish
sudo mkdir -p /var/www/rash
sudo chown -R $USER:$USER /var/www/rash

# Git repository'ni klonlash
cd /var/www/rash
git clone https://github.com/rakhmanuz/rash.git .

# Yoki agar repository mavjud bo'lsa
cd /var/www/rash
git pull
```

### Qadam 5: Environment variables sozlash

```bash
cd /var/www/rash
nano .env
```

`.env` fayl ichiga quyidagilarni kiriting:

```env
DATABASE_URL="file:./prisma/production.db"
NEXTAUTH_URL="https://rash.uz"
NEXTAUTH_SECRET="your-very-secure-secret-key-here-min-32-chars"
NODE_ENV="production"
PORT=3000
```

**Muhim:** `NEXTAUTH_SECRET` ni kuchli random string bilan almashtiring:

```bash
openssl rand -base64 32
```

### Qadam 6: Dependencies o'rnatish

```bash
cd /var/www/rash
npm ci
```

### Qadam 7: Prisma Database sozlash

```bash
cd /var/www/rash

# Prisma client generate qilish
npx prisma generate

# Database yaratish va schema'ni push qilish
npx prisma db push
```

### Qadam 8: Production build

```bash
cd /var/www/rash
npm run build
```

### Qadam 9: PM2 orqali ishga tushirish

```bash
cd /var/www/rash

# PM2'da ishga tushirish
pm2 start ecosystem.config.js --env production

# PM2'ni saqlash (server qayta ishga tushganda avtomatik ishga tushishi uchun)
pm2 save

# PM2 startup script yaratish
pm2 startup
# Chiqgan komandani nusxalab bajaring
```

### Qadam 10: Nginx sozlash

```bash
sudo nano /etc/nginx/sites-available/rash.uz
```

Quyidagi konfiguratsiyani kiriting:

```nginx
server {
    listen 80;
    server_name rash.uz www.rash.uz;

    client_max_body_size 10M;

    # Static fayllar
    location /_next/static {
        alias /var/www/rash/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Uploads
    location /uploads {
        alias /var/www/rash/public/uploads;
        expires 30d;
        add_header Cache-Control "public";
    }

    # Next.js server'ga proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

Nginx'ni faollashtirish:

```bash
# Symlink yaratish
sudo ln -s /etc/nginx/sites-available/rash.uz /etc/nginx/sites-enabled/

# Nginx konfiguratsiyasini tekshirish
sudo nginx -t

# Nginx'ni qayta ishga tushirish
sudo systemctl restart nginx
```

### Qadam 11: SSL sertifikat o'rnatish (HTTPS)

```bash
# Certbot o'rnatish
sudo apt install -y certbot python3-certbot-nginx

# SSL sertifikat olish
sudo certbot --nginx -d rash.uz -d www.rash.uz

# Avtomatik yangilanishni tekshirish
sudo certbot renew --dry-run
```

### Qadam 12: Tekshirish

```bash
# PM2 holatini ko'rish
pm2 status

# PM2 loglarni ko'rish
pm2 logs rash --lines 50

# Nginx holatini ko'rish
sudo systemctl status nginx

# Port 3000'ni tekshirish
sudo lsof -i :3000
```

**Saytni tekshiring:** https://rash.uz

---

## 🔄 Keyingi yangilanishlar

Har safar kod o'zgarganda:

### Local'da (Windows):

```powershell
cd C:\IQMax
git add -A
git commit -m "Yangi o'zgarishlar"
git push
```

### VPS'da:

```bash
cd /var/www/rash

# Tezkor komanda (barcha qadamlar birga)
git pull && \
npm ci && \
npx prisma generate && \
npx prisma db push && \
npm run build && \
pm2 restart rash
```

**Yoki qadamma-qadam:**

```bash
cd /var/www/rash

# 1. Kodni yangilash
git pull

# 2. Dependencies yangilash (agar package.json o'zgarganda)
npm ci

# 3. Prisma yangilash
npx prisma generate
npx prisma db push

# 4. Build qilish
npm run build

# 5. PM2 restart (MUHIM!)
pm2 restart rash
```

---

## ⚙️ Muhim sozlamalar

### PM2 Monitoring

```bash
# PM2 holatini ko'rish
pm2 status

# PM2 loglarni ko'rish
pm2 logs rash

# PM2 monitoring dashboard
pm2 monit

# PM2'ni to'xtatish
pm2 stop rash

# PM2'ni qayta ishga tushirish
pm2 restart rash

# PM2'ni o'chirish
pm2 delete rash
```

### Database Backup

```bash
cd /var/www/rash

# Backup yaratish
cp prisma/production.db prisma/production.db.backup.$(date +%Y%m%d_%H%M%S)

# Yoki script orqali
./scripts/backup-database.sh
```

### Loglarni ko'rish

```bash
# PM2 loglarni ko'rish
pm2 logs rash --lines 100

# Nginx error loglarni ko'rish
sudo tail -f /var/log/nginx/error.log

# Nginx access loglarni ko'rish
sudo tail -f /var/log/nginx/access.log
```

---

## 🆘 Muammolarni hal qilish

### 1. Sayt ishlamayapti

```bash
# PM2 holatini tekshirish
pm2 status

# PM2'ni qayta ishga tushirish
pm2 restart rash

# Yoki to'liq qayta ishga tushirish
pm2 delete rash
pm2 start ecosystem.config.js --env production
pm2 save
```

### 2. Build xatolik

```bash
cd /var/www/rash

# Cache tozalash
rm -rf .next
rm -rf node_modules/.cache

# Qayta build qilish
npm run build
```

### 3. Database xatolik

```bash
cd /var/www/rash

# Prisma'ni qayta generate qilish
npx prisma generate

# Database'ni yangilash
npx prisma db push

# PM2'ni restart qilish
pm2 restart rash
```

### 4. Port 3000 band

```bash
# Port'ni ishlatayotgan process'ni topish
sudo lsof -i :3000

# Process'ni o'chirish
sudo kill -9 PID

# Yoki PM2 orqali
pm2 restart rash
```

### 5. Nginx xatolik

```bash
# Nginx konfiguratsiyasini tekshirish
sudo nginx -t

# Nginx'ni qayta ishga tushirish
sudo systemctl restart nginx

# Nginx loglarni ko'rish
sudo tail -f /var/log/nginx/error.log
```

### 6. Memory yetmayapti

```bash
# PM2 memory limit'ni ko'rish
pm2 describe rash

# Memory limit'ni oshirish (ecosystem.config.js'da)
# max_memory_restart: '2G' qilib o'zgartiring

# PM2'ni restart qilish
pm2 restart rash
```

### 7. Git pull xatolik

```bash
cd /var/www/rash

# Local o'zgarishlarni saqlab qolish
git stash

# Pull qilish
git pull

# Stash'ni qaytarish (agar kerak bo'lsa)
git stash pop
```

### 8. SSL sertifikat yangilanishi

```bash
# SSL sertifikatni qo'lda yangilash
sudo certbot renew

# Avtomatik yangilanishni tekshirish
sudo certbot renew --dry-run
```

---

## 📝 Checklist

### Birinchi marta yuklash:

- [ ] Local'da kod Git'ga push qilingan
- [ ] VPS'ga SSH orqali ulanish muvaffaqiyatli
- [ ] Node.js, npm, PM2, Git, Nginx o'rnatilgan
- [ ] `/var/www/rash` papkasi yaratilgan
- [ ] Git repository klon qilingan
- [ ] `.env` fayl yaratilgan va to'ldirilgan
- [ ] `npm ci` muvaffaqiyatli
- [ ] `npx prisma generate` muvaffaqiyatli
- [ ] `npx prisma db push` muvaffaqiyatli
- [ ] `npm run build` muvaffaqiyatli
- [ ] PM2 ishga tushirilgan va saqlangan
- [ ] Nginx sozlangan va ishga tushirilgan
- [ ] SSL sertifikat o'rnatilgan
- [ ] Sayt https://rash.uz da ishlayapti

### Keyingi yangilanishlar:

- [ ] Local'da `git push` qilingan
- [ ] VPS'da `git pull` qilingan
- [ ] `npm ci` qilingan (agar package.json o'zgarganda)
- [ ] `npx prisma generate` qilingan (agar schema o'zgarganda)
- [ ] `npx prisma db push` qilingan (agar schema o'zgarganda)
- [ ] `npm run build` qilingan
- [ ] `pm2 restart rash` qilingan
- [ ] Sayt to'g'ri ishlayapti

---

## 🔗 Foydali havolalar

- PM2 dokumentatsiya: https://pm2.keymetrics.io/
- Nginx dokumentatsiya: https://nginx.org/en/docs/
- Next.js deployment: https://nextjs.org/docs/deployment
- Prisma deployment: https://www.prisma.io/docs/guides/deployment

---

## 📞 Yordam

Agar muammo yuzaga kelsa:

1. PM2 loglarni ko'ring: `pm2 logs rash --lines 100`
2. Nginx loglarni ko'ring: `sudo tail -f /var/log/nginx/error.log`
3. Build xatolikni tekshiring: `npm run build`
4. Database holatini tekshiring: `npx prisma db push`
