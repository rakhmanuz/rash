# Database Restore Script (PowerShell)
# Bu skript backup'dan database'ni tiklaydi

# Backup faylini tekshirish
if ($args.Count -eq 0) {
    Write-Host "❌ Backup faylini ko'rsating: .\restore-database.ps1 backups\rash_db_backup_YYYYMMDD_HHMMSS.db" -ForegroundColor Red
    exit 1
}

$BACKUP_FILE = $args[0]

if (-not (Test-Path $BACKUP_FILE)) {
    Write-Host "❌ Backup fayli topilmadi: $BACKUP_FILE" -ForegroundColor Red
    exit 1
}

# Database'ni restore qilish
$DB_PATH = ".\prisma\dev.db"
Copy-Item $BACKUP_FILE $DB_PATH -Force
Write-Host "✅ Database muvaffaqiyatli tiklandi: $BACKUP_FILE" -ForegroundColor Green
