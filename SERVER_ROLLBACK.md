# 🔄 Serverda Qaytarish (07:00 holatiga)

## ✅ Lokal va GitHub

- Lokal va `origin/main` endi **acca9d6** commitida (12-mart 07:44 — ertalab 07:00 dagi holat).
- `git push --force-with-lease origin main` allaqachon bajarildi.

## ⚠️ Serverni shu holatga keltirish

Serverga **SSH** orqali kiring va loyiha papkasida quyidagilarni bajaring.

### 1. Serverga ulanish

```bash
ssh root@rash.uz
```

(yoki sizda boshqa user/host bo'lsa: `ssh foydalanuvchi@rash.uz`)

### 2. Loyiha papkasiga o'tish

```bash
cd /var/www/rash
```

(yoki loyiha joylashgan yo'l: masalan `cd /root/rash`)

### 3. Git — remote dagi eski holatni olish

```bash
git fetch origin
git reset --hard origin/main
```

### 4. Deploy skriptini ishga tushirish

```bash
bash scripts/server-deploy.sh
```

Skript o'zi bajaradi: `npm ci` → `prisma generate` → PM2 to'xtatish → `prisma db push` → `.next` o'chirish → `npm run build` → PM2 qayta ishga tushirish.

### 5. Tekshirish

```bash
pm2 status
pm2 logs rash --lines 30
```

---

## Qisqacha (bitta blok — nusxalab serverda ishlating)

```bash
cd /var/www/rash && git fetch origin && git reset --hard origin/main && bash scripts/server-deploy.sh
```

Keyin: `pm2 status` va `pm2 logs rash --lines 30` bilan tekshiring.
