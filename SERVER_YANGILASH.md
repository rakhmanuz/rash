# Serverga yangilanishlarni yuklash

SSH orqali serverga kiring, keyin quyidagi buyruqlarni ketma-ket bajaring.

## 1. Loyiha papkasiga o‘ting

```bash
cd /root/rash
```

(Agar loyiha boshqa joyda bo‘lsa, masalan `/var/www/rash`, shu yo‘lni yozing.)

## 2. Git dan yangi kodni oling

```bash
git pull
```

## 3. Deploy (dependency, baza, build, PM2)

```bash
bash scripts/server-deploy.sh
```

Yoki qo‘lda:

```bash
npm ci
npx prisma generate
pm2 stop rash || true
npx prisma db push
npm run build
pm2 start ecosystem.config.js --env production
```

---

**Qisqacha (bitta blokni nusxalab serverda ishlating):**

```bash
cd /root/rash && git pull && bash scripts/server-deploy.sh
```

---

## Yangilanishlar ko‘rinmasa (eski build ishlayapti)

Agar sayt lokaldagi kabi yangilanmasa (masalan davomatda "Kechikkan" maydoni yo‘q), serverda **toza build** qiling:

```bash
cd /root/rash
git pull
rm -rf .next
npm run build
pm2 restart rash
```

Keyin brauzerda **Ctrl+Shift+R** (qattiq yangilash) qiling. Davomat modali ochilganda har bir **Bor** qilingan o‘quvchi qatorida «Kechikkan: [0] daq. 100%» ko‘rinishi kerak.
