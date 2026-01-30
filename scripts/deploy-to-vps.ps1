# VPS'ga Deploy Script

param(
    [Parameter(Mandatory=$true)]
    [string]$VpsIp,
    
    [Parameter(Mandatory=$false)]
    [string]$VpsUser = "root",
    
    [Parameter(Mandatory=$false)]
    [string]$VpsPath = "/var/www/rash"
)

Write-Host "🚀 VPS'ga deploy boshlandi..." -ForegroundColor Green

# 1. Git push
Write-Host "📤 Git'ga push qilinmoqda..." -ForegroundColor Yellow
git add -A
$commitMessage = Read-Host "Commit message (Enter for default)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Production deployment - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}
git commit -m $commitMessage
git push

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git push xatolik!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Git push muvaffaqiyatli" -ForegroundColor Green

# 2. VPS'ga SSH orqali deploy
Write-Host "🔌 VPS'ga ulanilmoqda..." -ForegroundColor Yellow
Write-Host "VPS IP: $VpsIp" -ForegroundColor Cyan
Write-Host "VPS User: $VpsUser" -ForegroundColor Cyan
Write-Host "VPS Path: $VpsPath" -ForegroundColor Cyan

$deployCommands = @"
cd $VpsPath
git pull
npm ci
npx prisma generate
npx prisma migrate deploy || npx prisma db push
npm run build
pm2 restart rash || pm2 start ecosystem.config.js --env production
pm2 save
"@

Write-Host ""
Write-Host "Quyidagi komandalarni VPS'da bajarishingiz kerak:" -ForegroundColor Yellow
Write-Host $deployCommands -ForegroundColor White
Write-Host ""
Write-Host "Yoki quyidagi komandani ishlatishingiz mumkin:" -ForegroundColor Yellow
Write-Host "ssh $VpsUser@$VpsIp 'cd $VpsPath && git pull && npm ci && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 restart rash'" -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ Deploy script yakunlandi!" -ForegroundColor Green
Write-Host "VPS'ga SSH orqali ulaning va yuqoridagi komandalarni bajarishingiz kerak." -ForegroundColor Yellow
