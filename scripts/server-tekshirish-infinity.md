# Serverda yangi kod ishlayaptimi tekshirish (Infinity v2)

## 1. Loyiha qaysi papkadan ishlayapti?

```bash
pm2 show rash
```

`exec cwd` yoki `cwd` — shu papkada ilova ishlayapti. Masalan: `/root/rash`. Barcha `git pull` va `npm run build` shu papkada bajarilishi kerak.

## 2. Manba kodda yangi matn bormi?

```bash
cd /root/rash
grep -n "Oldingi dublikatlarni" app/admin/infinity/page.tsx
grep -n "v2" app/admin/infinity/page.tsx
```

Agar natija chiqsa — serverdagi kod yangi. Chiqmasa — `git pull origin main` qiling.

## 3. Builddan keyin fayl ichida "v2" bormi?

```bash
cd /root/rash
grep -r "v2" .next/static/chunks/*.js 2>/dev/null | head -3
```

Yoki oddiy: yangi build qiling, keyin brauzerda rash.uz/admin/infinity oching. Sarlavha yonida **yashil "v2"** chip ko‘rinsa — yangi build yuklangan.

## 4. Boshqa papkadan ishlayotgan bo‘lishi mumkin

Agar siz `cd /root/rash` da pull va build qilsangiz, lekin PM2 boshqa papkadan (masalan `/var/www/rash`) ishga tushgan bo‘lsa — yangilanishlar ko‘rinmaydi. `pm2 show rash` da `cwd` ni tekshiring va xuddi shu papkada pull + build + restart qiling.

## 5. To‘liq qayta deploy (shu papkada)

```bash
cd /root/rash
git pull origin main
rm -rf .next
npm run build
pm2 restart rash
```

Keyin brauzerda rash.uz/admin/infinity — **Ctrl+Shift+R**. "Infinitylar" yonida **v2** ko‘rinishi kerak va 3 ta tugma (Dublikatlarni tozalash, Oldingi dublikatlarni olib tashlash, Uyga vazifa olib tashlash).
