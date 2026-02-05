# Server Action Xatolikni Tuzatish

## ❌ Xatolik

```
Error: Failed to find Server Action "x". This request might be from an older or newer deployment.
```

## 🔧 Yechim

Bu xatolik odatda build cache yoki eski build fayllari sababli bo'ladi.

### 1. Build Cache va Eski Fayllarni Tozalash

```bash
cd /var/www/rash

# Build cache tozalash
rm -rf .next
rm -rf node_modules/.cache

# Eski build fayllarini tozalash
rm -rf out
rm -rf dist
```

### 2. To'liq Qayta Build

```bash
# Dependencies yangilash
npm ci

# Prisma generate
npx prisma generate

# Yangi build
npm run build
```

### 3. PM2 Restart

```bash
# PM2 ni to'liq qayta ishga tushirish
pm2 delete rash
pm2 start ecosystem.config.js
pm2 save
```

### 4. Tekshirish

```bash
# Loglarni ko'rish
pm2 logs rash --lines 20

# Status tekshirish
pm2 status
```

## 🚀 Tezkor Fix (Barcha qadamlar birga)

```bash
cd /var/www/rash && \
rm -rf .next node_modules/.cache out dist && \
npm ci && \
npx prisma generate && \
npm run build && \
pm2 delete rash && \
pm2 start ecosystem.config.js && \
pm2 save
```

## 📋 Agar Xatolik Davom Etsa

1. **Node.js versiyasini tekshiring:**
   ```bash
   node -v
   ```
   Node.js 18+ bo'lishi kerak.

2. **Environment variables tekshiring:**
   ```bash
   pm2 env rash
   ```

3. **Port tekshiring:**
   ```bash
   netstat -tulpn | grep 3000
   ```

4. **Nginx konfiguratsiyasini tekshiring:**
   ```bash
   nginx -t
   systemctl status nginx
   ```
