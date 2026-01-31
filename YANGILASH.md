# 🔄 Rash.uz Server Yangilash Qo'llanmasi

## ⚡ Tezkor Yangilash (Har safar)

### Local'da (Windows PowerShell):

```powershell
cd C:\IQMax

# O'zgarishlarni ko'rish
git status

# Barcha o'zgarishlarni qo'shish
git add -A

# Commit qilish
git commit -m "Kamchiliklar tuzatildi"

# Git'ga push qilish
git push
```

### VPS'da (SSH orqali):

```bash
# VPS'ga ulanish
ssh root@rash.uz

# Tezkor yangilanish (bitta komanda)
cd /var/www/rash && \
git pull && \
npm ci && \
npx prisma generate && \
npx prisma db push && \
npm run build && \
pm2 restart rash
```

---

## 📋 Qadamma-qadam (Agar xatolik bo'lsa)

### 1. VPS'ga SSH orqali ulanish

```bash
ssh root@rash.uz
```

### 2. Kodni yangilash

```bash
cd /var/www/rash
git pull
```

### 3. Dependencies yangilash

```bash
npm ci
```

**Eslatma:** Agar `package.json` o'zgarmagan bo'lsa, bu qadam tez o'tadi.

### 4. Prisma yangilash

```bash
npx prisma generate
npx prisma db push
```

**Eslatma:** Agar database schema o'zgarmagan bo'lsa, `db push` tez o'tadi.

### 5. Production build

```bash
npm run build
```

**Eslatma:** Bu qadam bir necha daqiqa vaqt olishi mumkin.

### 6. PM2 restart (MUHIM!)

```bash
pm2 restart rash
```

**Eslatma:** Bu qadam shart! Aks holda eski kod ishlaydi.

### 7. Tekshirish

```bash
# PM2 holatini ko'rish
pm2 status

# PM2 loglarni ko'rish
pm2 logs rash --lines 50
```

---

## 🆘 Agar Xatolik Bo'lsa

### Build xatolik?

```bash
cd /var/www/rash

# Cache tozalash
rm -rf .next
rm -rf node_modules/.cache

# Qayta build qilish
npm run build

# PM2 restart
pm2 restart rash
```

### Database xatolik?

```bash
cd /var/www/rash

# Prisma'ni qayta generate qilish
npx prisma generate

# Database'ni yangilash
npx prisma db push

# PM2 restart
pm2 restart rash
```

### Git pull xatolik?

```bash
cd /var/www/rash

# Local o'zgarishlarni saqlab qolish
git stash

# Pull qilish
git pull

# Stash'ni qaytarish (agar kerak bo'lsa)
git stash pop
```

### PM2 ishlamayapti?

```bash
cd /var/www/rash

# PM2'ni to'liq qayta ishga tushirish
pm2 delete rash
pm2 start ecosystem.config.js --env production
pm2 save
```

### Sayt hali ham eski versiyani ko'rsatayapti?

```bash
# PM2'ni qayta restart qilish
pm2 restart rash

# Browser cache'ni tozalash
# Browser'da: Ctrl + Shift + R yoki Ctrl + F5
```

---

## ✅ Checklist

- [ ] Local'da `git push` qilingan
- [ ] VPS'ga SSH orqali ulanish muvaffaqiyatli
- [ ] VPS'da `git pull` qilingan
- [ ] `npm ci` muvaffaqiyatli
- [ ] `npx prisma generate` muvaffaqiyatli
- [ ] `npx prisma db push` muvaffaqiyatli
- [ ] `npm run build` muvaffaqiyatli
- [ ] `pm2 restart rash` qilingan
- [ ] PM2 holati to'g'ri (`pm2 status`)
- [ ] Sayt https://rash.uz da yangi versiyani ko'rsatayapti

---

## 🚀 Eng Tezkor Usul

**VPS'da bitta komanda:**

```bash
cd /var/www/rash && git pull && npm ci && npx prisma generate && npx prisma db push && npm run build && pm2 restart rash && pm2 logs rash --lines 20
```

Bu komanda:
1. Kodni yangilaydi
2. Dependencies'ni yangilaydi
3. Prisma'ni yangilaydi
4. Database'ni yangilaydi
5. Build qiladi
6. PM2'ni restart qiladi
7. Loglarni ko'rsatadi

---

## 📝 Eslatma

**MUHIM:** Har safar kod o'zgarganda:
1. Local'da `git push` qiling
2. VPS'da `git pull` qiling
3. `npm run build` qiling
4. `pm2 restart rash` qiling

Aks holda o'zgarishlar ko'rinmaydi!
