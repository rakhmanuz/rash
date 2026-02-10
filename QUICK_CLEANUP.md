# Tezkor Server Tozalash

## ⚠️ Muhim: Avval Git Pull Qiling!

Serverda yangi skriptlar ishlatishdan oldin, avval kodni yangilang:

```bash
cd /var/www/rash
git pull origin main
```

## 🧹 Tozalash Usullari

### 1. Tezkor Tozalash (Qo'lda)

```bash
cd /var/www/rash

# PM2 loglarini tozalash
pm2 flush rash

# Eski log fayllarni o'chirish
rm -f /root/.pm2/logs/rash-error.log.*
rm -f /root/.pm2/logs/rash-out.log.*

# Next.js cache tozalash
rm -rf .next/cache
rm -rf node_modules/.cache

# Temporary fayllar
find . -name "*.tmp" -type f -delete 2>/dev/null
find . -name ".DS_Store" -type f -delete 2>/dev/null
```

### 2. Skriptlar orqali (Git pull qilgandan keyin)

```bash
cd /var/www/rash
git pull origin main  # Avval yangilash!

# Tezkor tozalash
bash scripts/cleanup-logs.sh

# Yoki npm orqali
npm run cleanup

# To'liq tozalash
bash scripts/cleanup-server.sh

# Yoki npm orqali
npm run cleanup:full
```

### 3. Nginx Loglarini Tozalash

```bash
# Access log
> /var/log/nginx/rash.uz.access.log

# Error log
> /var/log/nginx/rash.uz.error.log

# Yoki logrotate ishlatish
logrotate -f /etc/logrotate.d/nginx
```

## 📊 Disk Joyini Tekshirish

```bash
# Disk foydalanilgan joy
df -h /var/www/rash

# Eng katta fayllar
du -h /var/www/rash | sort -rh | head -10

# PM2 loglar hajmi
du -sh /root/.pm2/logs/*.log
```

## ✅ Tezkor Komanda (Barcha)

```bash
cd /var/www/rash && \
pm2 flush rash && \
rm -f /root/.pm2/logs/rash-error.log.* /root/.pm2/logs/rash-out.log.* && \
rm -rf .next/cache node_modules/.cache && \
echo "✅ Tozalash yakunlandi!"
```
