# 🔄 Serverda Qaytarish Qadamlari

## ✅ Local Qaytarish Yakunlandi

Local repository 2026-02-01 21:43 holatiga qaytarildi (commit: 4fe2325)

## ⚠️ Keyingi Qadamlar

### 1. Force Push (Ehtiyot bo'ling!)

```bash
git push --force origin main
```

**Eslatma:** Bu barcha keyingi commit'larni bekor qiladi va remote repository'ni eski holatga qaytaradi.

### 2. Serverda Qaytarish

Serverga SSH orqali ulaning va quyidagilarni bajaring:

```bash
# 1. Serverga ulanish
ssh root@rash.uz

# 2. Papkaga o'tish
cd /var/www/rash

# 3. Git fetch va reset
git fetch origin
git reset --hard origin/main

# 4. Dependencies
npm ci --production=false

# 5. Prisma
npx prisma generate

# 6. Build cache tozalash
rm -rf .next
rm -rf node_modules/.cache

# 7. Production build
npm run build

# 8. PM2 restart
pm2 restart rash

# 9. Tekshirish
pm2 status
pm2 logs rash --lines 30
```

## 📋 Qaytarilgan O'zgarishlar

Quyidagi commit'lar bekor qilindi:
- ❌ 3d3ccb9 - ERR_CONNECTION_REFUSED fix
- ❌ 9eb79a9 - Complete server setup scripts
- ❌ b1aef70 - Nginx configuration
- ❌ 94c27d9 - PM2 --cwd fix
- ❌ 737600d - PM2 npm root fix
- ❌ 3593c25 - Password view functionality

## ✅ Hozirgi Holat

- ✅ Commit: 4fe2325 (2026-02-01 21:43)
- ✅ "Fix PM2 ecosystem config - set correct working directory"
- ✅ Barcha keyingi o'zgarishlar olib tashlandi
