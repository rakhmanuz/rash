# Database Ma'lumotlari va Backup

## 📊 Database Turi

Hozirgi vaqtda **SQLite** database ishlatilmoqda:
- **Fayl joylashuvi**: `prisma/dev.db`
- **Ma'lumotlar saqlanishi**: Database fayli serverda saqlanadi
- **O'chib ketishi**: Database fayli o'chirilmasa, ma'lumotlar saqlanib qoladi

## ✅ Ma'lumotlar Saqlanishi

**Ma'lumotlar o'chib ketmaydi**, chunki:
1. Database fayli (`prisma/dev.db`) serverda saqlanadi
2. Ma'lumotlar diskda doimiy saqlanadi
3. Server qayta ishga tushganda ham ma'lumotlar saqlanib qoladi

## 🔄 Backup Qilish

### Windows (PowerShell):
```powershell
.\scripts\backup-database.ps1
```

### Linux/Mac (Bash):
```bash
chmod +x scripts/backup-database.sh
./scripts/backup-database.sh
```

### Backup Joylashuvi:
- Backup'lar `backups/` papkasida saqlanadi
- Har bir backup: `rash_db_backup_YYYYMMDD_HHMMSS.db` formatida
- Eski backup'lar (30 kundan eski) avtomatik o'chiriladi

## 🔧 Database'ni Tiklash

### Windows (PowerShell):
```powershell
.\scripts\restore-database.ps1 backups\rash_db_backup_20240101_120000.db
```

### Linux/Mac (Bash):
```bash
chmod +x scripts/restore-database.sh
./scripts/restore-database.sh backups/rash_db_backup_20240101_120000.db
```

## 📅 Avtomatik Backup (VPS uchun)

VPS'da avtomatik backup qilish uchun `crontab` ishlating:

```bash
# Har kuni soat 02:00 da backup qilish
0 2 * * * cd /var/www/rash && bash scripts/backup-database.sh
```

## ⚠️ Muhim Eslatmalar

1. **Backup qiling**: Muntazam ravishda backup qiling
2. **Backup'ni saqlang**: Backup fayllarni boshqa joyga ham nusxalang
3. **Test qiling**: Backup va restore jarayonlarini test qiling
4. **Production**: Production'da PostgreSQL yoki boshqa professional database ishlatish tavsiya etiladi

## 🚀 Production Database (Keyinchalik)

Production uchun PostgreSQL yoki MySQL ishlatish tavsiya etiladi:
- `prisma/schema.production.prisma` fayli mavjud
- Production'da `DATABASE_URL` environment variable'ni sozlang
