# Production build script (PowerShell)
# Bu script production uchun barcha kerakli ishlarni bajaradi

Write-Host "🚀 Production build boshlandi..." -ForegroundColor Green

# 1. Dependencies o'rnatish
Write-Host "📦 Dependencies o'rnatilmoqda..." -ForegroundColor Yellow
npm ci --production=false
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Dependencies o'rnatishda xatolik!" -ForegroundColor Red
    exit 1
}

# 2. Prisma Client generate qilish
Write-Host "🗄️ Prisma Client generate qilinmoqda..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma Client generate qilishda xatolik!" -ForegroundColor Red
    exit 1
}

# 3. Database migration (agar kerak bo'lsa)
Write-Host "🔄 Database migration bajarilmoqda..." -ForegroundColor Yellow
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Migration muvaffaqiyatsiz, db push qilinmoqda..." -ForegroundColor Yellow
    npx prisma db push
}

# 4. TypeScript tekshirish
Write-Host "🔍 TypeScript tekshirilmoqda..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ TypeScript xatolari topildi, lekin build davom etadi..." -ForegroundColor Yellow
}

# 5. Next.js build
Write-Host "🏗️ Next.js build yaratilmoqda..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build muvaffaqiyatsiz!" -ForegroundColor Red
    exit 1
}

# 6. Build muvaffaqiyatli
Write-Host "✅ Production build muvaffaqiyatli yakunlandi!" -ForegroundColor Green
Write-Host "📝 Build fayllari .next/ papkasida" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ishga tushirish uchun:" -ForegroundColor Cyan
Write-Host "  npm start" -ForegroundColor White
Write-Host "  yoki" -ForegroundColor White
Write-Host "  pm2 start ecosystem.config.js" -ForegroundColor White
