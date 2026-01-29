#!/bin/bash

# Database Backup Script
# Bu skript SQLite database'ni backup qiladi

# Backup papkasi
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/rash_db_backup_$TIMESTAMP.db"

# Backup papkasini yaratish
mkdir -p "$BACKUP_DIR"

# SQLite database'ni nusxalash
if [ -f "prisma/dev.db" ]; then
    cp "prisma/dev.db" "$BACKUP_FILE"
    echo "✅ Backup muvaffaqiyatli yaratildi: $BACKUP_FILE"
    
    # Eski backup'larni saqlash (oxirgi 30 kun)
    find "$BACKUP_DIR" -name "rash_db_backup_*.db" -mtime +30 -delete
    echo "✅ Eski backup'lar tozalandi (30 kundan eski)"
else
    echo "❌ Database fayli topilmadi: prisma/dev.db"
    exit 1
fi
