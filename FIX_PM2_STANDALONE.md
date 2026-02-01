# 🔧 PM2 Standalone Xatolikni Tuzatish

## ⚠️ Xatolik:

```
▲ "next start" does not work with "output: standalone" configuration. 
Use "node .next/standalone/server.js" instead.
```

## ✅ Yechim 1: Standalone'ni O'chirish (Tavsiya etiladi)

`next.config.js` faylida `output: 'standalone'` ni comment qiling yoki o'chiring:

```javascript
// output: 'standalone', // PM2 bilan ishlatish uchun o'chirildi
```

Keyin qayta build qiling:

```bash
rm -rf .next
npm run build
pm2 restart rash
```

## ✅ Yechim 2: Standalone'ni Ishlatish (Agar kerak bo'lsa)

Agar `standalone` ishlatish kerak bo'lsa, PM2 konfiguratsiyasini o'zgartiring:

### `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'rash',
    script: 'node',
    args: '.next/standalone/server.js',
    cwd: '/var/www/rash',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
}
```

Keyin:

```bash
rm -rf .next
npm run build
pm2 delete rash
pm2 start ecosystem.config.js
pm2 save
```

## 📝 Eslatma:

Standalone mode kichikroq build yaratadi, lekin qo'shimcha sozlash talab qiladi. Oddiy `next start` ishlatish osonroq.

## 🔄 Serverda Tuzatish:

```bash
cd /var/www/rash

# Git yangilash
git pull origin main

# Build cache tozalash
rm -rf .next

# Qayta build
npm run build

# PM2 restart
pm2 restart rash

# Tekshirish
pm2 logs rash --lines 50
```
