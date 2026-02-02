# ⏪ 05:00 Holatiga Qaytarish

## ⚠️ Eslatma

Bu operatsiya barcha keyingi o'zgarishlarni bekor qiladi va 2026-02-02 05:00 dan oldingi holatga qaytaradi.

## 📋 Qaytariladigan Commit'lar

Quyidagi commit'lar bekor qilinadi:
- 3d3ccb9 (07:49) - ERR_CONNECTION_REFUSED fix
- 9eb79a9 (07:40) - Complete server setup scripts
- b1aef70 (07:28) - Nginx configuration
- 94c27d9 (07:17) - PM2 --cwd fix
- 737600d (07:08) - PM2 npm root fix
- 3593c25 (06:20) - Password view functionality

## ✅ Qaytarish Qadamlari

### Variant A: 2026-02-01 21:43 holatiga qaytarish (Tavsiya etiladi)

```bash
# 1. Hozirgi holatni saqlash (ixtiyoriy)
git branch backup-before-rollback

# 2. 2026-02-01 21:43 commit'ga qaytarish
git reset --hard 4fe2325

# 3. Force push (ehtiyot bo'ling!)
git push --force origin main
```

### Variant B: 2026-02-02 05:00 dan oldingi oxirgi commit'ga qaytarish

```bash
# 1. 05:00 dan oldingi oxirgi commit'ni topish
git log --until="2026-02-02 05:00" --format="%h %ai %s" -1

# 2. O'sha commit'ga qaytarish
git reset --hard <commit-hash>

# 3. Force push
git push --force origin main
```

## 🔄 Serverda Qaytarish

Serverda ham qaytarish kerak:

```bash
# 1. Serverga SSH orqali ulaning
ssh root@rash.uz

# 2. Papkaga o'tish
cd /var/www/rash

# 3. Git pull (force)
git fetch origin
git reset --hard origin/main

# 4. Dependencies
npm ci --production=false

# 5. Prisma
npx prisma generate

# 6. Build
npm run build

# 7. PM2 restart
pm2 restart rash
```

## ⚠️ Muhim Eslatma

- **Force push** boshqa ishlayotgan developerlar uchun muammo bo'lishi mumkin
- **Serverda** ham qaytarish kerak
- **Backup** yaratish tavsiya etiladi

## 📝 Qaytarilgan Fayllar

Quyidagi fayllar o'chiriladi yoki eski holatiga qaytadi:
- `FIX_CONNECTION_REFUSED.sh`
- `COMPLETE_SERVER_SETUP.sh`
- `FIX_502_ERROR.sh`
- `NGINX_CONFIG_RASH_UZ.md`
- `SETUP_RASH_UZ_DOMAIN.sh`
- `ecosystem.config.js` (eski holatiga qaytadi)
- `app/admin/students/page.tsx` (parol funksiyasi olib tashlanadi)
- `app/api/admin/students/[id]/route.ts` (parol reset funksiyasi olib tashlanadi)
