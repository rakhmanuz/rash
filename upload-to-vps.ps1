# VPS'ga fayllarni yuborish skripti
# Foydalanish: .\upload-to-vps.ps1

$VPS_IP = "YOUR_VPS_IP"  # O'zgartiring
$VPS_USER = "root"        # Agar boshqa bo'lsa, o'zgartiring
$PROJECT_PATH = "C:\IQMax"
$REMOTE_PATH = "/var/www/iqmax"

Write-Host "=== IQMax proyektini VPS'ga yuborish ===" -ForegroundColor Green

# 1. .gitignore'dagi fayllarni hisobga olgan holda zip yaratish
Write-Host "`n1. Zip fayl yaratilmoqda..." -ForegroundColor Yellow
$zipPath = "$env:TEMP\iqmax-upload.zip"

# node_modules va .next ni o'tkazib yuborish
Get-ChildItem -Path $PROJECT_PATH -Exclude node_modules,.next,out,build,.git | 
    Compress-Archive -DestinationPath $zipPath -Force

Write-Host "   ✓ Zip yaratildi: $zipPath" -ForegroundColor Green

# 2. VPS'ga yuborish
Write-Host "`n2. VPS'ga yuborilmoqda..." -ForegroundColor Yellow
scp $zipPath "${VPS_USER}@${VPS_IP}:/tmp/iqmax-upload.zip"

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Fayl yuborildi!" -ForegroundColor Green
    
    Write-Host "`n3. VPS'da quyidagi komandalarni bajaring:" -ForegroundColor Cyan
    Write-Host "   cd /var/www/iqmax" -ForegroundColor White
    Write-Host "   unzip -o /tmp/iqmax-upload.zip" -ForegroundColor White
    Write-Host "   rm /tmp/iqmax-upload.zip" -ForegroundColor White
    Write-Host "   npm ci" -ForegroundColor White
    Write-Host "   npx prisma generate" -ForegroundColor White
    Write-Host "   npm run build" -ForegroundColor White
} else {
    Write-Host "   ✗ Xatolik! VPS IP va user to'g'riligini tekshiring." -ForegroundColor Red
}

# 3. Temp faylni o'chirish
Remove-Item $zipPath -ErrorAction SilentlyContinue

Write-Host "`n=== Tugadi ===" -ForegroundColor Green
