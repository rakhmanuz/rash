# Server Yuklash (Deploy) Qo'llanmasi

## 🚀 Tezkor Deploy

### 1. Kodni Git'ga Push Qilish

```powershell
cd C:\IQMax
git add -A
git commit -m "Production ready"
git push
```

### 2. VPS'ga SSH orqali Ulanish

```bash
ssh root@VPS_IP
# yoki
ssh username@VPS_IP
```

### 3. VPS'da Kodni Yangilash

```bash
cd /var/www/rash
git pull
```

### 4. Dependencies O'rnatish

```bash
npm ci
```

### 5. Prisma Database Yangilash

```bash
npx prisma generate
npx prisma migrate deploy
# yoki agar migration yo'q bo'lsa
npx prisma db push
```

### 6. Production Build

```bash
npm run build
```

### 7. PM2 orqali Ishga Tushirish

```bash
pm2 restart rash
# yoki
pm2 start ecosystem.config.js --env production
```

### 8. Tekshirish

```bash
pm2 status
pm2 logs rash --lines 50
```

## 📋 To'liq Deploy Qadamlar

### Variant A: Git orqali (Tavsiya etiladi)

**1. Kompyuteringizda:**
```powershell
cd C:\IQMax
git add -A
git commit -m "Production deployment"
git push
```

**2. VPS'da:**
```bash
cd /var/www/rash
git pull
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart rash
```

### Variant B: SCP orqali (To'g'ridan-to'g'ri)

**Kompyuteringizda (PowerShell):**
```powershell
cd C:\IQMax

# ZIP yaratish
Compress-Archive -Path app,components,lib,middleware.ts,next.config.js,package.json,package-lock.json,postcss.config.js,prisma,public,scripts,server.js,ecosystem.config.js,tailwind.config.js,tsconfig.json,types,capacitor.config.ts,.gitignore -DestinationPath rash-deploy.zip -Force

# VPS'ga yuborish
scp rash-deploy.zip root@VPS_IP:/tmp/rash-deploy.zip
```

**VPS'da:**
```bash
cd /var/www/rash
unzip -o /tmp/rash-deploy.zip
rm /tmp/rash-deploy.zip
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart rash
```

## 🔧 Environment Variables

VPS'da `.env` fayl yaratish:

```bash
nano /var/www/rash/.env
```

`.env` ichiga:
```env
DATABASE_URL="file:./prisma/production.db"
NEXTAUTH_URL="https://rash.uz"
NEXTAUTH_SECRET="your-very-secure-secret-key-here"
NODE_ENV="production"
PORT=3000
```

**Muhim:** `NEXTAUTH_SECRET` ni kuchli random string bilan almashtiring:
```bash
openssl rand -base64 32
```

## 🌐 Nginx Sozlash

### Nginx Konfiguratsiya

```bash
sudo nano /etc/nginx/sites-available/rash.uz
```

Quyidagilarni kiriting:
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
    }
}
```

### Nginx'ni Faollashtirish

```bash
sudo ln -s /etc/nginx/sites-available/rash.uz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 SSL Sertifikat (HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d rash.uz -d www.rash.uz
```

## ✅ Tekshirish

1. **Sayt ishlayaptimi?**
   - https://rash.uz ga kiring

2. **PM2 ishlayaptimi?**
   ```bash
   pm2 status
   ```

3. **Nginx ishlayaptimi?**
   ```bash
   sudo systemctl status nginx
   ```

## 🔄 Keyingi O'zgarishlarni Yuklash

```bash
cd /var/www/rash
git pull
npm ci
npm run build
pm2 restart rash
```

## 🆘 Muammolarni Hal Qilish

### Port 3000 band?

```bash
sudo lsof -i :3000
sudo kill -9 PID
```

### Database xatolik?

```bash
cd /var/www/rash
npx prisma db push
npx prisma generate
pm2 restart rash
```

### Loglarni ko'rish

```bash
pm2 logs rash --lines 100
```

## 📝 Checklist

- [ ] Kod Git'ga push qilingan
- [ ] VPS'da kod yangilangan
- [ ] Dependencies o'rnatilgan
- [ ] Database migration bajarilgan
- [ ] Build muvaffaqiyatli
- [ ] PM2 ishlayapti
- [ ] Nginx sozlangan
- [ ] SSL sertifikat o'rnatilgan
- [ ] Sayt ishlayapti
