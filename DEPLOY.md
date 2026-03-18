# Serverga yuklash (Deploy)

## 1. Loyihani serverga yuborish

```bash
git add .
git commit -m "Monitor panel va boshqa o'zgarishlar"
git push origin main
```

Serverda (yoki CI/CD orqali):

```bash
cd /path/to/IQMax   # loyiha papkangiz
git pull origin main
```

## 2. O‘rnatish va build

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
# agar migrate yo‘q bo‘lsa: npx prisma db push
npm run build
```

## 3. PM2 orqali ishga tushirish

```bash
pm2 start ecosystem.config.js --env production
# yoki qayta ishga tushirish:
pm2 restart rash
```

## 4. Muhim environment o‘zgaruvchilar (.env)

Serverda `.env` faylida bo‘lishi kerak:

- `DATABASE_URL` — Prisma uchun (production DB)
- `NEXTAUTH_SECRET` — NextAuth uchun (tasodifiy uzun satr)
- `NEXTAUTH_URL` — sayt manzili, masalan: `https://rash.uz`

## 5. Tekshirish

- https://rash.uz — bosh sahifa
- https://rash.uz/login — kirish
- https://rash.uz/monitor — monitor panel (admin/menejer hisobi kerak)

## Qisqa bitta buyruq (mavjud skript)

```bash
npm run deploy:prod
```

Bu: `npm ci` → Prisma generate → migrate → build → PM2 restart qiladi.
