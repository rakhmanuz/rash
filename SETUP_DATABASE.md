# Database Yaratish va Sozlash

## Muammo:
`The table 'main.User' does not exist in the current database` xatolik chiqyapti.

## Yechim:

### 1. Serverga SSH orqali kirish:
```bash
ssh root@rash.uz
```

### 2. Project folder'ga o'tish:
```bash
cd /var/www/rash
```

### 3. Database'ni yaratish (avtomatik):
```bash
# Git'dan yangi script'ni olish
git pull origin main

# Script'ni executable qilish
chmod +x setup-database.sh

# Script'ni ishga tushirish
./setup-database.sh
```

### 4. Yoki qo'lda:

```bash
# 1. Prisma generate
npx prisma generate

# 2. Database migration (MUHIM!)
npx prisma db push --skip-generate

# 3. Database mavjudligini tekshirish
ls -la dev.db

# 4. Jadval mavjudligini tekshirish
sqlite3 dev.db "SELECT name FROM sqlite_master WHERE type='table' AND name='User';"
```

## Agar Database Mavjud Bo'lsa:

Agar database allaqachon mavjud bo'lsa, lekin jadvallar yo'q bo'lsa:

```bash
# Force reset (EHTIYOT: Barcha ma'lumotlar o'chadi!)
npx prisma db push --force-reset --skip-generate
```

## Keyin Admin Yaratish:

Database yaratilgandan keyin:

```bash
# Standart admin
node scripts/create-admin.js

# Yoki o'z login va parolingiz bilan
node scripts/create-admin.js rashadmin Rash2024! Rash Admin
```

## Tekshirish:

1. **Database mavjudligi:**
   ```bash
   ls -la dev.db
   ```

2. **Jadvallar:**
   ```bash
   sqlite3 dev.db "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
   ```

3. **User jadvali:**
   ```bash
   sqlite3 dev.db "SELECT COUNT(*) FROM User;"
   ```

## Muammo Hal Bo'lmasa:

1. **Prisma client'ni qayta generate qilish:**
   ```bash
   rm -rf node_modules/.prisma
   npx prisma generate
   ```

2. **Database'ni to'liq qayta yaratish:**
   ```bash
   # EHTIYOT: Barcha ma'lumotlar o'chadi!
   rm dev.db
   npx prisma db push
   ```

3. **Loglarni ko'rish:**
   ```bash
   npx prisma db push --skip-generate --verbose
   ```
