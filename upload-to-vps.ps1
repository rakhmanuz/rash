# VPS IP manzilini o'zgartiring
param(
    [Parameter(Mandatory=$true)]
    [string]$VpsIp,
    
    [Parameter(Mandatory=$false)]
    [string]$VpsUser = "root"
)

Write-Host "🚀 IQMax proyektini VPS'ga yuborish..." -ForegroundColor Green

# Proyekt papkasiga o'tish
$projectPath = "C:\IQMax"
if (-not (Test-Path $projectPath)) {
    Write-Host "❌ Proyekt papkasi topilmadi: $projectPath" -ForegroundColor Red
    exit 1
}

Set-Location $projectPath

# Zip fayl nomi
$zipFileName = "iqmax-vps-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
$zipFilePath = Join-Path $projectPath $zipFileName

# Exclude list
$excludeList = @(
    "node_modules",
    ".next",
    ".git",
    ".vscode",
    ".idea",
    "coverage",
    "dist",
    "build",
    "*.log",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    ".env*.local",
    ".env",
    ".vercel",
    "*.tsbuildinfo",
    "next-env.d.ts",
    "prisma/dev.db",
    "prisma/dev.db-journal",
    "Thumbs.db",
    "*.zip",
    "VPS_DEPLOY.md"
)

Write-Host "📦 Fayllarni zip'lash..." -ForegroundColor Yellow

# Zip yaratish
$filesToZip = Get-ChildItem -Path $projectPath -Force | Where-Object {
    $item = $_
    $shouldExclude = $false
    foreach ($exclude in $excludeList) {
        if ($item.Name -like $exclude -or $item.Name -eq $exclude) {
            $shouldExclude = $true
            break
        }
    }
    -not $shouldExclude
}

$filesToZip | Compress-Archive -DestinationPath $zipFilePath -Force

$zipSize = (Get-Item $zipFilePath).Length / 1MB
Write-Host "✅ Zip yaratildi: $zipFileName ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green

# VPS'ga yuborish
Write-Host "📤 VPS'ga yuborilmoqda: ${VpsUser}@${VpsIp}:/tmp/$zipFileName" -ForegroundColor Yellow

try {
    scp $zipFilePath "${VpsUser}@${VpsIp}:/tmp/$zipFileName"
    Write-Host "✅ Fayllar muvaffaqiyatli yuborildi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Keyingi qadamlar (VPS'da SSH terminalda):" -ForegroundColor Cyan
    Write-Host "   sudo mkdir -p /var/www/rash" -ForegroundColor White
    Write-Host "   cd /var/www/rash" -ForegroundColor White
    Write-Host "   sudo unzip /tmp/$zipFileName" -ForegroundColor White
    Write-Host "   rm /tmp/$zipFileName" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Xatolik: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Yechim:" -ForegroundColor Yellow
    Write-Host "   1. SSH key o'rnatilganligini tekshiring" -ForegroundColor White
    Write-Host "   2. VPS IP va user to'g'riligini tekshiring" -ForegroundColor White
    Write-Host "   3. Qo'lda yuborish: scp $zipFileName ${VpsUser}@${VpsIp}:/tmp/" -ForegroundColor White
}

# Mahalliy zip'ni o'chirish
Remove-Item $zipFilePath -Force
Write-Host "🧹 Mahalliy zip fayl o'chirildi" -ForegroundColor Gray
