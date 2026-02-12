# rash.com.uz – Serverga to'g'ri yuklash (port 3001)

rash.uz va rash.com.uz ikkita alohida portda ishlaydi – host va cache muammolari yo'q.

## Arxitektura

| Domen        | Port | PM2 process   | Vazifa                |
|-------------|------|---------------|------------------------|
| rash.uz     | 3000 | rash          | Asosiy sayt (landing)  |
| rash.com.uz | 3001 | rash-payment  | To'lov login           |

---

## 1. Serverda kod yangilash

```bash
cd /var/www/rash
git pull
npm ci
npx prisma generate
npm run build
```

---

## 2. PM2 – ikkita process

**Eski processni to'xtatish (agar faqat rash bor edi):**
```bash
pm2 delete rash 2>/dev/null || true
```

**Yangi config bilan ishga tushirish:**
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

**Statusni tekshirish:**
```bash
pm2 status
# rash          | online | 3000
# rash-payment  | online | 3001
```

---

## 3. Nginx – rash.com.uz port 3001 ga

**rash.com.uz config:**
```bash
sudo nano /etc/nginx/sites-available/rash.com.uz
```

```nginx
server {
    listen 80;
    server_name rash.com.uz www.rash.com.uz;

    access_log /var/log/nginx/rash.com.uz.access.log;
    error_log /var/log/nginx/rash.com.uz.error.log;

    location / {
        proxy_pass http://127.0.0.1:3001;
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

**rash.uz 3000 da qolishi kerak:**
```nginx
# rash.uz config – proxy_pass http://127.0.0.1:3000
```

**Configlarni faollashtirish va tekshirish:**
```bash
sudo ln -sf /etc/nginx/sites-available/rash.com.uz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. SSL (HTTPS)

```bash
sudo certbot --nginx -d rash.com.uz -d www.rash.com.uz
```

---

## 5. .env sozlamalari

**rash (port 3000)** – `.env` yoki PM2 env:
```
NEXTAUTH_URL=https://rash.uz
```

**rash-payment (port 3001)** – ecosystem.config.js da:
```
RASH_MODE=payment
NEXTAUTH_URL=https://rash.com.uz
```

(ecosystem.config.js ichida qo'yilgan)

---

## 6. Tekshirish

```bash
# rash.uz – asosiy sayt (landing)
curl -I http://localhost:3000/

# rash.com.uz – to'lov login (302 → /rash)
curl -I http://localhost:3001/
# Location: /rash bo'lishi kerak
```

---

## 7. Yangilash jarayoni (keyingi safar)

```bash
cd /var/www/rash
git pull
npm ci
npx prisma generate
npm run build
pm2 restart rash rash-payment
pm2 save
```
