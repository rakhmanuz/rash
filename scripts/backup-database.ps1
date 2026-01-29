# Database Backup Script (PowerShell)
# Bu skript SQLite database'ni backup qiladi

# Backup papkasi
$BACKUP_DIR = ".\backups"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR\rash_db_backup_$TIMESTAMP.db"

# Backup papkasini yaratish
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

# SQLite database'ni nusxalash
$DB_PATH = ".\prisma\dev.db"
if (Test-Path $DB_PATH) {
    Copy-Item $DB_PATH $BACKUP_FILE
    Write-Host "✅ Backup muvaffaqiyatli yaratildi: $BACKUP_FILE" -ForegroundColor Green
    
    # Eski backup'larni saqlash (oxirgi 30 kun)
    $CUTOFF_DATE = (Get-Date).AddDays(-30)
    Get-ChildItem -Path $BACKUP_DIR -Filter "rash_db_backup_*.db" | 
        Where-Object { $_.LastWriteTime -lt $CUTOFF_DATE } | 
        Remove-Item -Force
    Write-Host "✅ Eski backup'lar tozalandi (30 kundan eski)" -ForegroundColor Green
} else {
    Write-Host "❌ Database fayli topilmadi: $DB_PATH" -ForegroundColor Red
    exit 1
}
