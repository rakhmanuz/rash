# O'zgarishlar ko'rinmasa (Infinity tugmalari)

Agar serverda "Oldingi dublikatlarni olib tashlash" tugmasi yoki boshqa yangilanishlar ko'rinmasa:

## 1. Serverda to'liq yangilash va toza build

SSH orqali serverga kiring, keyin **loyiha papkasida** (masalan `/root/rash` yoki `/var/www/rash`):

```bash
cd /root/rash
git pull
rm -rf .next
npm run build
pm2 restart rash
```

Yoki bitta skript bilan:

```bash
cd /root/rash && git pull && rm -rf .next && npm run build && pm2 restart rash
```

Agar `npm ci` ham qilmoqchi bo'lsangiz (dependency yangilansa):

```bash
cd /root/rash && git pull && npm ci && npx prisma generate && rm -rf .next && npm run build && pm2 restart rash
```

## 2. Brauzerda keshnini tozalash

- **Windows/Linux:** `Ctrl + Shift + R` (qattiq yangilash)
- **Mac:** `Cmd + Shift + R`

Yoki: brauzerda saytni oching → F12 (Developer tools) → Application/Storage → "Clear site data" yoki Cache’ni tozalang.

## 3. Tekshirish

- Admin panel → **Infinitylar** sahifasida uchta tugma bo‘lishi kerak:
  1. Dublikatlarni tozalash
  2. **Oldingi dublikatlarni olib tashlash**
  3. Uyga vazifa ∞ olib tashlash

Agar baribir ko‘rinmasa, serverda `ls -la app/api/admin/infinity/` qilib `cleanup-last-duplicate` papkasi bor-yo‘qligini tekshiring.
