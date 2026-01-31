# Bir Nechta Domenlarni Sozlash

Bu hujjatda `rash.uz`, `rash.com.uz`, va `rash.net.uz` domenlarini bir xil saytga ulash qadamlari ko'rsatilgan.

## 📋 Server Sozlamalari

### 1. Nginx Virtual Host Sozlash

Har bir domen uchun Nginx virtual host yarating yoki bitta hostda barcha domenlarni qo'shing:

```nginx
# /etc/nginx/sites-available/rash
server {
    listen 80;
    server_name rash.uz www.rash.uz rash.com.uz www.rash.com.uz rash.net.uz www.rash.net.uz;
    
    # HTTP'dan HTTPS'ga redirect
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rash.uz www.rash.uz rash.com.uz www.rash.com.uz rash.net.uz www.rash.net.uz;

    ssl_certificate /etc/letsencrypt/live/rash.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rash.uz/privkey.pem;
    
    # SSL sozlamalari
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Root directory
    root /var/www/rash/.next/standalone;
    
    # Static files
    location /_next/static {
        alias /var/www/rash/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
    
    # Public files
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
    }
}
```

### 2. SSL Sertifikat Olish (Let's Encrypt)

Barcha domenlar uchun SSL sertifikat oling:

```bash
certbot certonly --nginx -d rash.uz -d www.rash.uz -d rash.com.uz -d www.rash.com.uz -d rash.net.uz -d www.rash.net.uz
```

### 3. Environment Variables

`.env` yoki `.env.production` faylida quyidagilarni sozlang:

```env
# Asosiy URL (birinchi domen)
NEXT_PUBLIC_BASE_URL=https://rash.uz
NEXTAUTH_URL=https://rash.uz

# Yoki agar barcha domenlar ishlashi kerak bo'lsa:
# NEXTAUTH_URL barcha domenlar uchun ishlashi kerak
# NextAuth avtomatik ravishda joriy domenni aniqlaydi

# Database
DATABASE_URL="file:./prisma/prod.db"

# NextAuth Secret
NEXTAUTH_SECRET="your-secret-key-here"
```

## 🔧 Kod Sozlamalari

### 1. next.config.js
✅ **Bajarildi** - Barcha domenlar `images.domains` ga qo'shildi

### 2. app/layout.tsx
✅ **Bajarildi** - `metadataBase` dinamik qilindi va joriy domenni aniqlaydi

### 3. Middleware
Middleware avtomatik ravishda barcha domenlarda ishlaydi, chunki u domenga bog'liq emas.

## 🚀 Deploy Qadamlar

1. **Kodni yangilash:**
```bash
cd /var/www/rash
git pull
```

2. **Dependencies o'rnatish:**
```bash
npm ci
```

3. **Prisma generate:**
```bash
npx prisma generate
npx prisma db push
```

4. **Build:**
```bash
npm run build
```

5. **PM2 restart:**
```bash
pm2 restart rash
```

6. **Nginx reload:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## ✅ Tekshirish

Har bir domenni tekshiring:
- https://rash.uz
- https://www.rash.uz
- https://rash.com.uz
- https://www.rash.com.uz
- https://rash.net.uz
- https://www.rash.net.uz

Barcha domenlar bir xil saytni ko'rsatishi kerak.

## 🔒 Xavfsizlik

- Barcha domenlar HTTPS orqali ishlashi kerak
- SSL sertifikatlar to'g'ri sozlangan bo'lishi kerak
- CORS sozlamalari to'g'ri bo'lishi kerak (Next.js avtomatik qiladi)

## 📝 Eslatmalar

- Barcha domenlar bir xil ma'lumotlar bazasini ishlatadi
- Barcha domenlar bir xil session va authentication tizimini ishlatadi
- SEO uchun asosiy domen (`rash.uz`) canonical URL sifatida ishlatiladi
- Open Graph va Twitter Card images barcha domenlar uchun ishlaydi
