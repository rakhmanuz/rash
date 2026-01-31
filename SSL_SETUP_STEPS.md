# SSL Sertifikat Sozlash - Keyingi Qadamlar

## ✅ 1. Certbot Jarayoni Tugagach

Certbot jarayoni tugagach, quyidagi xabarni ko'rasiz:
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/rash.uz/fullchain.pem
```

## 🔧 2. Nginx Konfiguratsiyasini Yangilash

Nginx konfiguratsiya faylini tahrirlang:

```bash
sudo nano /etc/nginx/sites-available/rash
```

Quyidagi konfiguratsiyani qo'llang:

```nginx
# HTTP'dan HTTPS'ga redirect
server {
    listen 80;
    server_name rash.uz www.rash.uz rash.com.uz www.rash.com.uz rash.net.uz www.rash.net.uz;
    
    # HTTP'dan HTTPS'ga redirect
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name rash.uz www.rash.uz rash.com.uz www.rash.com.uz rash.net.uz www.rash.net.uz;

    # SSL sertifikatlar
    ssl_certificate /etc/letsencrypt/live/rash.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rash.uz/privkey.pem;
    
    # SSL sozlamalari
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root directory
    root /var/www/rash/.next/standalone;
    
    # Static files
    location /_next/static {
        alias /var/www/rash/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
    
    # Public files (favicon, images, etc.)
    location /favicon.ico {
        alias /var/www/rash/public/favicon.ico;
        expires 30d;
    }
    
    location / {
        try_files $uri $uri/ @nextjs;
    }
    
    location @nextjs {
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

## ✅ 3. Nginx Konfiguratsiyasini Tekshirish va Reload

```bash
# Konfiguratsiyani tekshirish
sudo nginx -t

# Agar "syntax is ok" ko'rsatsa, reload qiling
sudo systemctl reload nginx

# Yoki restart
sudo systemctl restart nginx
```

## 🚀 4. Kodni Yangilash va Deploy

```bash
cd /var/www/rash

# Git'dan yangi kodlarni olish
git pull

# Dependencies o'rnatish
npm ci

# Prisma generate
npx prisma generate
npx prisma db push

# Build
npm run build

# PM2 restart
pm2 restart rash

# Status tekshirish
pm2 status
pm2 logs rash --lines 20
```

## ✅ 5. Domenlarni Tekshirish

Har bir domenni brauzerda ochib tekshiring:

- ✅ https://rash.uz
- ✅ https://www.rash.uz
- ✅ https://rash.com.uz
- ✅ https://www.rash.com.uz
- ✅ https://rash.net.uz
- ✅ https://www.rash.net.uz

Barcha domenlar:
- ✅ SSL sertifikat bilan ishlashi kerak (yashil qulf ikoni)
- ✅ Bir xil saytni ko'rsatishi kerak
- ✅ Login va boshqa funksiyalar ishlashi kerak

## 🔄 6. SSL Sertifikatni Avtomatik Yangilash

Certbot avtomatik yangilashni sozlaydi. Tekshirish:

```bash
# Yangilash test qilish
sudo certbot renew --dry-run

# Yangilash jadvalini ko'rish
sudo systemctl status certbot.timer
```

## ⚠️ Muammolar Bo'lsa

### Nginx xatolik?
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### PM2 ishlamayapti?
```bash
pm2 logs rash
pm2 restart rash
```

### SSL sertifikat xatolik?
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```
