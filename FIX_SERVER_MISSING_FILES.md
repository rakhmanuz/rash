# 🔧 Serverda Yo'qolgan Fayllarni Tiklash

Agar serverda `package.json` yoki boshqa fayllar topilmasa, quyidagi qadamlarni bajaring:

## 🚨 Muammo

```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/var/www/rash/package.json'
```

## ✅ Yechim

### Variant 1: Script ishlatish (Tavsiya etiladi)

```bash
cd /var/www/rash
chmod +x scripts/fix-server-missing-files.sh
./scripts/fix-server-missing-files.sh
```

### Variant 2: Qo'lda tiklash

```bash
# 1. PM2'ni to'xtatish
pm2 stop rash
pm2 delete rash

# 2. Papkaga kirish
cd /var/www/rash

# 3. Git holatini tekshirish va yangilash
git fetch origin
git reset --hard origin/main
git pull origin main --force

# 4. Fayllarni tekshirish
ls -la
# package.json, prisma/schema.prisma va boshqa fayllar bo'lishi kerak

# 5. Agar fayllar yo'q bo'lsa, qayta clone qiling
cd /var/www
rm -rf rash
git clone https://github.com/rakhmanuz/rash.git rash
cd rash

# 6. Dependencies o'rnatish
npm install

# 7. Prisma
npx prisma generate
npx prisma db push

# 8. Build
npm run build

# 9. PM2 ishga tushirish
pm2 start npm --name "rash" -- start
pm2 save
```

### Variant 3: To'liq qayta o'rnatish

Agar hech narsa ishlamasa:

```bash
# 1. PM2'ni to'xtatish
pm2 stop all
pm2 delete all

# 2. Database backup (agar mavjud bo'lsa)
mkdir -p /var/www/rash-backups
cp /var/www/rash/prisma/dev.db /var/www/rash-backups/dev.db.backup 2>/dev/null || true

# 3. Eski papkani o'chirish
cd /var/www
rm -rf rash

# 4. Yangi clone
git clone https://github.com/rakhmanuz/rash.git rash
cd rash

# 5. Environment variables yaratish
nano .env.local
# Quyidagilarni qo'shing:
# DATABASE_URL="file:./prisma/dev.db"
# NEXTAUTH_SECRET="your-secret-key"
# NEXTAUTH_URL="https://rash.uz"

# 6. O'rnatish
npm install
npx prisma generate
npx prisma db push

# 7. Admin yaratish (agar kerak bo'lsa)
node scripts/create-admin.js

# 8. Build
npm run build

# 9. PM2
pm2 start npm --name "rash" -- start
pm2 save
pm2 startup
```

## 🔍 Tekshirish

```bash
# Fayllarni tekshirish
cd /var/www/rash
ls -la
ls -la prisma/

# Git holatini tekshirish
git status
git log --oneline -5

# PM2 status
pm2 status
pm2 logs rash --lines 50
```

## 📝 Muhim Eslatmalar

1. **Git pull** - Har safar `git pull` qilishdan oldin `git fetch origin` qiling
2. **Force pull** - Agar muammo bo'lsa, `git pull origin main --force` ishlating
3. **Reset** - Agar fayllar aralashgan bo'lsa, `git reset --hard origin/main` ishlating
4. **Database backup** - Har safar o'chirishdan oldin database'ni backup qiling

## 🐛 Qo'shimcha Muammo Hal Qilish

### Git pull ishlamayapti?

```bash
git fetch origin
git reset --hard origin/main
git clean -fd
git pull origin main
```

### Permission xatolik?

```bash
sudo chown -R $USER:$USER /var/www/rash
chmod -R 755 /var/www/rash
```

### Port band?

```bash
lsof -ti:3000 | xargs kill -9
# yoki
fuser -k 3000/tcp
```
