# Serverga yuklash (Deploy)

## 1. Git orqali (tavsiya etiladi)

Loyihani avval Git ga yuboring:

```bash
git add .
git commit -m "Kunlik statistika ustunlar, serverga deploy"
git push origin main
```

**Serverni SSH orqali ulang**, keyin loyiha papkasida:

```bash
cd /path/to/IQMax   # loyiha papkangiz
git pull origin main
npm run deploy:prod
```

`deploy:prod` quyidagilarni bajaradi:
- `npm ci` — toza o‘rnatish
- `npx prisma generate` — Prisma client
- `pm2 stop rash` — ilovani to‘xtatish (SQLite **database is locked** xatosini oldini olish uchun)
- `npx prisma migrate deploy` — migratsiyalar
- `npm run build` — production build
- `pm2 start rash` — ilovani qayta ishga tushirish

---

## 2. Fayllarni qo‘lda yuklash (FTP/SCP/rsync)

Agar Git ishlatmasangiz, loyiha fayllarini serverga nusxalang (`.env`, `node_modules` va `.next` dan tashqari). Keyin serverda:

```bash
cd /path/to/IQMax
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart rash
```

---

## 2.1. SQLite "database is locked" xatosi

Agar serverda **SQLite** ishlatilsa va `prisma migrate deploy` paytida `database is locked` xatosi chiqsa, ilova (PM2) DB faylini band qilayotgan bo‘ladi. Serverni to‘xtatib, migratsiyani keyin qayta ishga tushiring:

```bash
pm2 stop rash
npx prisma migrate deploy
npm run build
pm2 start rash
# yoki barchasini bir martada: npm run deploy:prod
```

`deploy:prod` skripti endi avtomatik ravishda migratsiyadan oldin `pm2 stop rash` ni bajaradi.

---

## 3. Muhim eslatmalar

- **`.env`** va **`.env.local`** serverda bo‘lishi va to‘g‘ri sozlangan bo‘lishi kerak (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL va hokazo).
- **Prisma**: Agar SQLite ishlatilsa, `prisma/dev.db` serverda mavjud bo‘lishi kerak; PostgreSQL bo‘lsa, `DATABASE_URL` serverda to‘g‘ri bo‘lishi kerak.
- **PM2**: `ecosystem.config.js` da `rash` ilovasi sozlangan; serverda `pm2 list` bilan tekshiring.

---

## 4. Tekshirish

Deploy dan keyin:

```bash
pm2 status
pm2 logs rash --lines 50
```

Brauzerda sayt manzilini ochib (masalan `https://your-domain.com`) ishlashini tekshiring.
