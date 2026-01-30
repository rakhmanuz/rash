#!/bin/bash

# Production build script
# Bu script production uchun barcha kerakli ishlarni bajaradi

set -e

echo "🚀 Production build boshlandi..."

# 1. Dependencies o'rnatish
echo "📦 Dependencies o'rnatilmoqda..."
npm ci --production=false

# 2. Prisma Client generate qilish
echo "🗄️ Prisma Client generate qilinmoqda..."
npx prisma generate

# 3. Database migration (agar kerak bo'lsa)
echo "🔄 Database migration bajarilmoqda..."
npx prisma migrate deploy || npx prisma db push

# 4. TypeScript tekshirish
echo "🔍 TypeScript tekshirilmoqda..."
npx tsc --noEmit

# 5. Next.js build
echo "🏗️ Next.js build yaratilmoqda..."
npm run build

# 6. Build muvaffaqiyatli
echo "✅ Production build muvaffaqiyatli yakunlandi!"
echo "📝 Build fayllari .next/ papkasida"
echo ""
echo "Ishga tushirish uchun:"
echo "  npm start"
echo "  yoki"
echo "  pm2 start ecosystem.config.js"
