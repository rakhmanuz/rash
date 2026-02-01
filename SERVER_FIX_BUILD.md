# 🔧 Server Build Muammosini Tuzatish

## ⚠️ Muammo:
Localhost'da sayt yaxshi ko'rinadi, lekin rash.uz serverda CSS/JS yuklanmayapti yoki ko'rinish yomon.

## ✅ Yechim:

### 1. Serverga SSH orqali ulaning:
```bash
ssh root@rash.uz
# yoki
ssh your_username@rash.uz
```

### 2. Scriptni ishga tushiring:
```bash
cd /var/www/rash
chmod +x scripts/fix-server-build.sh
./scripts/fix-server-build.sh
```

### 3. Yoki qo'lda bajaring:

```bash
cd /var/www/rash

# PM2 to'xtatish
pm2 stop rash
pm2 delete rash

# Eski build va cache tozalash
rm -rf .next
rm -rf node_modules/.cache
rm -rf .cache

# Git yangilash
git fetch origin
git reset --hard origin/main
git clean -fd

# Dependencies yangilash
npm ci --legacy-peer-deps

# Prisma
npx prisma generate
npx prisma db push --skip-generate

# Build
NODE_ENV=production npm run build

# PM2 qayta ishga tushirish
pm2 start ecosystem.config.js
pm2 save

# Status
pm2 status
pm2 logs rash --lines 50
```

## 🔍 Tekshirish:

### 1. Browser'da:
- F12 > Network tab
- CSS va JS fayllar yuklanayotganini tekshiring
- 404 xatoliklar bor-yo'qligini ko'ring

### 2. Server'da:
```bash
# Build mavjudligini tekshiring
ls -la .next/static

# PM2 loglar
pm2 logs rash

# Port tekshirish
netstat -tulpn | grep 3000
```

### 3. Nginx konfiguratsiyasi:
```bash
# Nginx config tekshiring
cat /etc/nginx/sites-available/rash.uz

# Nginx reload
sudo nginx -t
sudo systemctl reload nginx
```

## 📝 Nginx Config (to'g'ri bo'lishi kerak):

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static fayllar uchun
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🚨 Agar muammo davom etsa:

1. **Browser cache tozalash:**
   - Ctrl+Shift+Delete
   - Hard refresh: Ctrl+F5

2. **Server loglar:**
   ```bash
   pm2 logs rash --err
   tail -f /var/log/nginx/error.log
   ```

3. **Environment variables:**
   ```bash
   cat .env.local
   # NEXTAUTH_URL=https://rash.uz
   # NEXTAUTH_SECRET=...
   # DATABASE_URL=...
   ```

4. **Port tekshirish:**
   ```bash
   lsof -i :3000
   # Agar port band bo'lsa:
   kill -9 $(lsof -t -i:3000)
   ```
