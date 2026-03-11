# Serverga yuklash (deploy)

## Davomat: `lateMinutes` yangiligi

Serverda davomat "kechikkan daqiqa" bilan ishlashi uchun bazada `lateMinutes` ustuni bo‘lishi kerak.

## 1. Kodni serverga yuborish

```bash
git add .
git commit -m "feat: davomatda kechikkan daqiqa (lateMinutes) va foiz hisoblash"
git push
```

Serverda (yoki CI/CD orqali):

```bash
cd /path/to/project
git pull
```

## 2. Serverda deploy

Loyihadagi skript:

```bash
npm run deploy:prod
```

Bu skript quyidagilarni bajaradi:

- `npm ci` – dependency’lar
- `npx prisma generate` – Prisma client
- `pm2 stop rash` – ilovani to‘xtatish
- `npx prisma migrate deploy || npx prisma db push` – baza yangilanishi
- `npm run build` – build
- `pm2 restart` – ilovani qayta ishga tushirish

**Muhim:**  
Agar loyihada `prisma/migrations` bo‘lmasa, `prisma migrate deploy` ishlamaydi va `prisma db push` ishlaydi. `db push` joriy `schema.prisma` asosida bazaga kerakli ustunlarni (jumladan `lateMinutes`) qo‘shadi.

## 3. Qaysi schema ishlatiladi?

- **Odatiy:** Serverda `prisma/schema.prisma` ishlatiladi (`.env` dagi `DATABASE_URL` bo‘yicha). Unda `lateMinutes` bor, shuning uchun `db push` yoki migrate bilan baza yangilansa, serverda ham ishlaydi.
- **Production schema:** Agar serverda `schema.production.prisma` ishlatilsa, unda ham `lateMinutes` qo‘shilgan – bu fayl ham deploy uchun tayyor.

## 4. PostgreSQL (production) da

Agar production PostgreSQL bo‘lsa:

1. `.env` da `DATABASE_URL` to‘g‘ri ko‘rsatilganligini tekshiring.
2. `npm run deploy:prod` dan keyin `npx prisma db push` (yoki migrate) bajarilgan bo‘lsa, `Attendance` jadvalida `lateMinutes` ustuni paydo bo‘ladi.

## 5. Xatolik bo‘lsa

- **"Unknown argument 'lateMinutes'"** – serverda `prisma generate` yangi schema bilan ishlamagan. Serverni to‘xtatib, `npx prisma generate` qayta ishlating, keyin ilovani qayta ishga tushiring.
- **Migration xatosi** – agar faqat `db push` ishlatilsa, `npx prisma db push` ni alohida ishlatib ko‘ring (schema va baza bir xil bo‘lishi kerak).
