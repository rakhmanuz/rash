# Serverda terminaldan tekshirish va tuzatish

SSH orqali serverga kiring, keyin buyruqlarni ketma-ket bajaring.

---

## A. Avval tekshiruv (nima noto‘g‘ri?)

```bash
cd /root/rash
bash scripts/server-tekshiruv.sh
```

Chiqgan natijani o‘qing:
- **"Kechikkan kodi bormi?"** — agar **YO'Q** bo‘lsa, `git pull` qiling.
- **".next yo'q"** yoki BUILD_ID juda eski — build qilinmagan yoki eski; toza build kerak.
- **PM2** — "exec cwd" yoki "script path" qaysi papkada ekanini tekshiring; loyiha papkasi bilan bir xil bo‘lishi kerak.

---

## B. Toza build va qayta ishga tushirish

Loyiha papkasida (PM2 qaysi papkadan ishlayotganini tekshiring — masalan `/var/www/rash`):

```bash
cd /var/www/rash
git pull
npx prisma generate
rm -rf .next
npm run build
pm2 restart rash
```

**Muhim:** `npx prisma generate` builddan **oldingin** qilish shart — aks holda "lateMinutes does not exist" kabi build xatoligi chiqadi.

Build xato bersa, xabarni to‘liq nusxalab yuboring.

---

## C. PM2 qaysi papkadan ishlayotganini bilish

```bash
pm2 show rash
```

"**exec cwd**" qatoridagi papka — ilova shu joydan ishlayapti. Masalan agar `exec cwd: /var/www/rash` bo‘lsa, yangilanishlarni **shu papkada** qilishingiz kerak (`/root/rash` emas):

```bash
cd /var/www/rash
git pull
rm -rf .next
npm run build
pm2 restart rash
```

---

## D. Bitta blok (/var/www/rash da: pull + prisma generate + toza build + restart)

```bash
cd /var/www/rash && \
git pull && \
npx prisma generate && \
rm -rf .next && \
npm run build && \
pm2 restart rash && \
pm2 status
```

Agar `npm run build` xato bersa, xabarini to‘liq yozib yuboring.
