# Xatoliklarni Topish va Tekshirish

## 1. PM2 Loglarini Tekshirish (Eng Muhim):

```bash
# Oxirgi 50 qator loglarni ko'rish
pm2 logs rash --lines 50

# Real-time loglarni kuzatish (Ctrl+C bilan to'xtatish)
pm2 logs rash

# Faqat xatoliklarni ko'rish
pm2 logs rash --err --lines 50

# Faqat muvaffaqiyatli loglarni ko'rish
pm2 logs rash --out --lines 50
```

## 2. Browser Console'ni Tekshirish:

1. Browser'dan saytni oching: `https://rash.uz/login`
2. F12 yoki Right Click → Inspect
3. **Console** tab'ni oching
4. Qizil xatoliklarni ko'ring
5. **Network** tab'ni oching
6. Request'larni tekshiring:
   - Qaysi request xatolik berayapti?
   - Status code nima? (200, 401, 500, va hokazo)
   - Response nima?

## 3. Server Log Fayllarini Tekshirish:

```bash
# PM2 error log
tail -f /var/www/rash/logs/pm2-error.log

# PM2 output log
tail -f /var/www/rash/logs/pm2-out.log

# Yoki agar logs folder yo'q bo'lsa:
tail -f ~/.pm2/logs/rash-error-0.log
tail -f ~/.pm2/logs/rash-out-0.log
```

## 4. Nginx Loglarini Tekshirish:

```bash
# Nginx error log
sudo tail -f /var/log/nginx/error.log

# Nginx access log
sudo tail -f /var/log/nginx/access.log
```

## 5. Database Xatoliklarini Tekshirish:

```bash
# Database mavjudligini tekshirish
cd /var/www/rash
ls -la dev.db

# Database'ni tekshirish
sqlite3 dev.db "SELECT COUNT(*) FROM User;"

# Agar xatolik bersa:
npx prisma db push --skip-generate
```

## 6. Environment Variables'ni Tekshirish:

```bash
cd /var/www/rash

# .env.local mavjudligini tekshirish
ls -la .env.local

# Environment variables'ni ko'rish (parol ko'rinmaydi)
cat .env.local | grep -v SECRET

# NEXTAUTH_URL tekshirish
cat .env.local | grep NEXTAUTH_URL

# NEXTAUTH_SECRET mavjudligini tekshirish (qiymat ko'rinmaydi)
cat .env.local | grep NEXTAUTH_SECRET
```

## 7. Build Xatoliklarini Tekshirish:

```bash
cd /var/www/rash

# Build qilish va xatoliklarni ko'rish
npm run build 2>&1 | tee build-errors.log

# Build log'ni ko'rish
cat build-errors.log
```

## 8. Node Modules Xatoliklarini Tekshirish:

```bash
cd /var/www/rash

# Node modules mavjudligini tekshirish
ls -la node_modules | head -20

# Agar yo'q bo'lsa:
npm install
```

## 9. Port Xatoliklarini Tekshirish:

```bash
# Port 3000'da nima ishlayapti?
lsof -i :3000

# Yoki
netstat -tulpn | grep 3000

# Agar port band bo'lsa:
lsof -ti:3000 | xargs kill -9
```

## 10. Umumiy Tekshirish Script:

```bash
#!/bin/bash
echo "=== Server Tekshirish ==="
echo ""

echo "1. PM2 Status:"
pm2 status
echo ""

echo "2. PM2 Logs (oxirgi 10 qator):"
pm2 logs rash --lines 10 --nostream
echo ""

echo "3. Port 3000:"
lsof -i :3000 || echo "Port 3000 bo'sh"
echo ""

echo "4. Database:"
cd /var/www/rash
ls -la dev.db 2>/dev/null && echo "✓ Database mavjud" || echo "✗ Database yo'q"
echo ""

echo "5. .env.local:"
ls -la .env.local 2>/dev/null && echo "✓ .env.local mavjud" || echo "✗ .env.local yo'q"
echo ""

echo "6. .next folder:"
ls -la .next 2>/dev/null && echo "✓ Build mavjud" || echo "✗ Build yo'q"
echo ""

echo "7. Node modules:"
ls -la node_modules 2>/dev/null && echo "✓ Node modules mavjud" || echo "✗ Node modules yo'q"
echo ""
```

## Eng Tezkor Yechim:

```bash
# Barcha loglarni bir vaqtda ko'rish
cd /var/www/rash && pm2 logs rash --lines 50
```

## Browser'dan Xatolikni Topish:

1. **F12** bosib Developer Tools'ni oching
2. **Console** tab'da qizil xatoliklarni ko'ring
3. **Network** tab'da:
   - Request'larni filter qiling: `Failed` yoki `4xx`, `5xx`
   - Xatolik bergan request'ni bosing
   - **Response** tab'da xatolik xabari ko'rinadi

## Eng Keng Tarqalgan Xatoliklar:

1. **502 Bad Gateway** → PM2 ishlamayapti yoki port band
2. **500 Internal Server Error** → Server-side xatolik (PM2 loglarida ko'rinadi)
3. **401 Unauthorized** → Session muammosi
4. **404 Not Found** → Route topilmadi
5. **"Yuklanmoqda..."** → JavaScript xatolik (Browser console'da ko'rinadi)
