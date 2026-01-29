#!/bin/bash

# Database Restore Script
# Bu skript backup'dan database'ni tiklaydi

# Backup faylini tekshirish
if [ -z "$1" ]; then
    echo "❌ Backup faylini ko'rsating: ./restore-database.sh backups/rash_db_backup_YYYYMMDD_HHMMSS.db"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup fayli topilmadi: $BACKUP_FILE"
    exit 1
fi

# Database'ni restore qilish
cp "$BACKUP_FILE" "prisma/dev.db"
echo "✅ Database muvaffaqiyatli tiklandi: $BACKUP_FILE"
