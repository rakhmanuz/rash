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

Loyiha papkasida (masalan `/root/rash`):

```bash
cd /root/rash
git pull
rm -rf .next
npm run build
pm2 restart rash
```

Build xato bersa, xabarni to‘liq nusxalab yuboring.

---

## C. PM2 qaysi papkadan ishlayotganini bilish

```bash
pm2 show rash
```

"exec cwd" yoki "script path" qatorida papka ko‘rsatiladi. Agar u `/root/rash` emas, boshqa papkada (masalan `/root`) ilova ishlayotgan bo‘ladi — shu papkaga o‘tib, u yerda `git pull` va build qilishingiz kerak, yoki PM2 ni to‘g‘ri papkadan qayta ishga tushiring:

```bash
cd /root/rash
pm2 delete rash
pm2 start ecosystem.config.js --env production
```

---

## D. Bitta blok (tekshiruv + toza build + restart)

```bash
cd /root/rash && \
echo "=== Git ===" && git log -1 --oneline && git pull && \
echo "=== Eski build o'chirish ===" && rm -rf .next && \
echo "=== Yangi build ===" && npm run build && \
echo "=== PM2 restart ===" && pm2 restart rash && \
echo "=== Tugadi ===" && pm2 status
```

Agar `npm run build` xato bersa, xabarini to‘liq yozib yuboring.
