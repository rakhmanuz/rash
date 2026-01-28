# RASH - Windows Server Setup Script

Write-Host "========================================" -ForegroundColor Green
Write-Host "  RASH - Windows Server Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 1. Node.js tekshirish
Write-Host "[1/6] Node.js tekshirilmoqda..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "XATOLIK: Node.js o'rnatilmagan!" -ForegroundColor Red
    Write-Host "https://nodejs.org dan o'rnating" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js versiyasi: $nodeVersion" -ForegroundColor Green

# 2. PM2 o'rnatish
Write-Host "[2/6] PM2 tekshirilmoqda..." -ForegroundColor Yellow
$pm2Check = pm2 --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "PM2 o'rnatilmoqda..." -ForegroundColor Yellow
    npm install -g pm2
    npm install -g pm2-windows-startup
    Write-Host "PM2 o'rnatildi!" -ForegroundColor Green
} else {
    Write-Host "PM2 allaqachon o'rnatilgan" -ForegroundColor Green
}

# 3. Database provider o'zgartirish
Write-Host "[3/6] Database provider PostgreSQL'ga o'zgartirilmoqda..." -ForegroundColor Yellow
npm run switch-to-postgresql
Write-Host "Database provider yangilandi!" -ForegroundColor Green

# 4. Dependencies o'rnatish
Write-Host "[4/6] Dependencies o'rnatilmoqda..." -ForegroundColor Yellow
npm install
Write-Host "Dependencies o'rnatildi!" -ForegroundColor Green

# 5. Prisma Client generate
Write-Host "[5/6] Prisma Client generate qilinmoqda..." -ForegroundColor Yellow
npm run db:generate
Write-Host "Prisma Client generate qilindi!" -ForegroundColor Green

# 6. Build
Write-Host "[6/6] Production build qilinmoqda..." -ForegroundColor Yellow
npm run build
Write-Host "Build muvaffaqiyatli!" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Muvaffaqiyatli Yakunlandi!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Keyingi qadamlar:" -ForegroundColor Yellow
Write-Host "1. .env faylini to'ldiring (DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET)" -ForegroundColor Cyan
Write-Host "2. PostgreSQL database yarating" -ForegroundColor Cyan
Write-Host "3. start-server-pm2.bat ni ishga tushiring" -ForegroundColor Cyan
Write-Host "4. DNS sozlang (rash.uz -> sizning IP manzilingiz)" -ForegroundColor Cyan
Write-Host ""
