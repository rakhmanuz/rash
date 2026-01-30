# Production Build Qo'llanmasi

Bu qo'llanma production build yaratish va deploy qilish uchun.

## Talablar

- Node.js 18+ yoki 20+
- npm yoki yarn
- Prisma CLI
- PM2 (production uchun)

## Qadamlar

### 1. Environment Variables Sozlash

`.env` fayl yarating va quyidagilarni to'ldiring:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-very-secure-secret-key-here"
NODE_ENV="production"
PORT=3000
```

**Muhim:** `NEXTAUTH_SECRET` ni production uchun kuchli random string bilan almashtiring:
```bash
openssl rand -base64 32
```

### 2. Dependencies O'rnatish

```bash
npm ci
```

### 3. Prisma Database Sozlash

```bash
# Prisma Client generate qilish
npx prisma generate

# Database migration (production uchun)
npx prisma migrate deploy

# Yoki agar migration yo'q bo'lsa
npx prisma db push
```

### 4. Production Build

**Windows:**
```powershell
.\scripts\build-production.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/build-production.sh
./scripts/build-production.sh
```

**Yoki qo'lda:**
```bash
npm run build
```

### 5. Production Server Ishga Tushirish

**PM2 bilan (tavsiya etiladi):**
```bash
npm run pm2:start
```

**Yoki oddiy:**
```bash
npm start
```

## PM2 Management

```bash
# Status ko'rish
npm run pm2:status

# Loglarni ko'rish
npm run pm2:logs

# Restart
npm run pm2:restart

# Stop
npm run pm2:stop
```

## Performance Optimizatsiyalari

1. **Next.js Standalone Output** - `.next/standalone` papkasida minimal build
2. **Image Optimization** - AVIF va WebP formatlari qo'llab-quvvatlanadi
3. **Compression** - Gzip compression yoqilgan
4. **Security Headers** - XSS, CSRF, va boshqa xavfsizlik headerlari qo'shilgan
5. **Console.log Removal** - Production build'da console.log'lar olib tashlanadi (error va warn qoladi)

## Database Backup

Production'da muntazam backup qiling:

**Windows:**
```powershell
.\scripts\backup-database.ps1
```

**Linux/Mac:**
```bash
./scripts/backup-database.sh
```

## Monitoring

PM2 monitoring:
```bash
pm2 monit
```

## Troubleshooting

### Build xatoliklari

1. `npm ci` bilan dependencies'ni tozalab qayta o'rnating
2. `.next` papkasini o'chiring va qayta build qiling
3. `node_modules` ni o'chiring va qayta o'rnating

### Database xatoliklari

1. Prisma Client'ni qayta generate qiling: `npx prisma generate`
2. Database migration'ni tekshiring: `npx prisma migrate status`

### Port muammolari

`.env` faylida `PORT` o'zgaruvchisini o'zgartiring yoki PM2 config'da portni o'zgartiring.

## Production Checklist

- [ ] Environment variables to'g'ri sozlangan
- [ ] `NEXTAUTH_SECRET` kuchli va xavfsiz
- [ ] Database migration bajarilgan
- [ ] Build muvaffaqiyatli yakunlangan
- [ ] PM2 yoki boshqa process manager ishlayapti
- [ ] Backup script sozlangan
- [ ] Monitoring sozlangan
- [ ] SSL sertifikat o'rnatilgan (HTTPS uchun)
- [ ] Firewall sozlangan
- [ ] Log rotation sozlangan
