# 🔧 npm ci Xatolikni Hal Qilish

## ❌ Muammo

Serverda `npm ci` xatolik ko'rsatayapti:
```
npm error code EUSAGE
The 'npm ci' command can only install with an existing package-lock.json
```

## ✅ Yechim

`package-lock.json` fayli Git'ga qo'shildi. Endi serverda quyidagilarni bajaring:

### VPS'da:

```bash
cd /var/www/rash

# Yangi package-lock.json ni olish
git pull

# Endi npm ci ishlaydi
npm ci

# Qolgan qadamlarni davom ettirish
npx prisma generate
npx prisma db push
npm run build
pm2 restart rash
```

### Yoki bitta komanda:

```bash
cd /var/www/rash && git pull && npm ci && npx prisma generate && npx prisma db push && npm run build && pm2 restart rash
```

## 📝 Eslatma

`npm ci` `package-lock.json` faylini talab qiladi. Bu fayl:
- Dependencies'ning aniq versiyalarini belgilaydi
- Production'da bir xil versiyalarni o'rnatishni ta'minlaydi
- `npm install` dan tezroq ishlaydi

Agar `package-lock.json` yo'q bo'lsa, `npm install` ishlatish mumkin, lekin bu faylni yangilashi mumkin.
