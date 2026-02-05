# Webhook 404 Xatolikni Tezkor Tuzatish

## ❌ Muammo

Webhook 404 qaytaryapti:
```
"last_error_message":"Wrong response from the webhook: 404 Not Found"
```

## ⚡ Tezkor Yechim

Serverda quyidagi scriptni ishga tushiring:

```bash
cd /var/www/rash
bash FIX_WEBHOOK_404_NOW.sh
```

## 📋 Yoki Qo'lda

```bash
cd /var/www/rash

# 1. To'liq tozalash
rm -rf .next node_modules/.cache out dist

# 2. Route fayl tekshirish
ls -la app/api/telegram/webhook/route.ts

# 3. Qayta build
npm ci
npx prisma generate
npm run build

# 4. Build tekshirish
ls -la .next/server/app/api/telegram/webhook/

# 5. PM2 restart
pm2 delete rash
pm2 start ecosystem.config.js
pm2 save

# 6. Localhost test
sleep 3
curl -X POST http://localhost:3000/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{"test":true}'

# 7. Webhook qayta sozlash
curl -X POST "https://api.telegram.org/bot8510849426:AAGmpWgTp5aziP0qy28ntDoN8ferOZ6iKsE/setWebhook?url=https://rash.uz/api/telegram/webhook"
```

## 🔍 Tekshirish

### 1. Route fayl mavjudligi
```bash
ls -la app/api/telegram/webhook/route.ts
```

### 2. Build qilingan route
```bash
ls -la .next/server/app/api/telegram/webhook/
```

### 3. Localhost test
```bash
curl http://localhost:3000/api/telegram/webhook
```

Agar localhost ishlasa, muammo Nginx'da.

### 4. Nginx konfiguratsiyasi
```bash
cat /etc/nginx/sites-available/rash.uz | grep -A 10 "location /"
```

Nginx quyidagicha bo'lishi kerak:
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## ✅ Tekshirish Ro'yxati

- [ ] Route fayl mavjud: `app/api/telegram/webhook/route.ts`
- [ ] Build muvaffaqiyatli
- [ ] Build route mavjud: `.next/server/app/api/telegram/webhook/`
- [ ] Localhost endpoint ishlayapti
- [ ] PM2 online
- [ ] Webhook sozlangan
- [ ] Nginx to'g'ri proxy qilmoqda
