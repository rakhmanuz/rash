# Local O'zgarishlarni Server'ga Yuklash

## ❌ Muammo
Local'da o'zgarishlar bor, lekin saytda ko'rinmayapti.

## ✅ Yechim

### 1. Local'da O'zgarishlarni Git'ga Push Qilish

```powershell
cd C:\IQMax

# O'zgarishlarni ko'rish
git status

# Barcha o'zgarishlarni qo'shish
git add -A

# Commit qilish
git commit -m "Yangi funksiyalar qo'shildi"

# Git'ga push qilish
git push
```

### 2. VPS'da Kodni Yangilash

VPS'ga SSH orqali ulaning va quyidagilarni bajaring:

```bash
cd /var/www/rash

# Kodni yangilash
git pull

# Dependencies yangilash (agar package.json o'zgarganda)
npm ci

# Prisma yangilash (agar schema o'zgarganda)
npx prisma generate
npx prisma db push

# Build qilish
npm run build

# PM2 restart (muhim!)
pm2 restart rash
```

### 3. Tekshirish

```bash
# PM2 holatini ko'rish
pm2 status

# Loglarni ko'rish
pm2 logs rash --lines 50

# Saytni tekshirish
curl http://localhost:3000
```

## 🔄 Tezkor Komanda (Barcha qadamlar)

**VPS'da:**
```bash
cd /var/www/rash && git pull && npm ci && npx prisma generate && npx prisma db push && npm run build && pm2 restart rash
```

## ⚠️ Muhim Eslatmalar

1. **PM2 restart qilish shart!** - Build qilgandan keyin har doim `pm2 restart rash` qiling
2. **Git pull qilish shart!** - VPS'da `git pull` qilmasangiz, yangi kod kelmaydi
3. **Build qilish shart!** - Kod o'zgarganda `npm run build` qilish kerak

## 🆘 Agar Hali Ham Ishlamasa

### 1. PM2 to'liq restart

```bash
pm2 delete rash
pm2 start ecosystem.config.js --env production
pm2 save
```

### 2. Cache tozalash

```bash
rm -rf .next
rm -rf node_modules/.cache
npm run build
pm2 restart rash
```

### 3. Browser cache tozalash

- Browser'da `Ctrl + Shift + R` (hard refresh)
- Yoki `Ctrl + F5`

## 📝 Checklist

- [ ] Local'da o'zgarishlar commit qilingan
- [ ] Git'ga push qilingan
- [ ] VPS'da `git pull` qilingan
- [ ] VPS'da `npm ci` qilingan (agar package.json o'zgarganda)
- [ ] VPS'da `npx prisma generate` qilingan (agar schema o'zgarganda)
- [ ] VPS'da `npm run build` qilingan
- [ ] VPS'da `pm2 restart rash` qilingan
- [ ] Browser cache tozalangan
