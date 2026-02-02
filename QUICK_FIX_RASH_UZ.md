# ⚡ rash.uz Saytini Tezkor Tuzatish

## 🚨 Muammo

rash.uz sayti ishlamayapti - ERR_CONNECTION_REFUSED

## ✅ Tezkor Yechim

Serverga SSH orqali ulaning va quyidagi scriptni ishga tushiring:

```bash
# 1. Serverga ulanish
ssh root@rash.uz

# 2. Papkaga o'tish
cd /var/www/rash

# 3. Git pull
git pull origin main

# 4. Scriptni ishga tushirish
chmod +x FIX_RASH_UZ_NOW.sh
./FIX_RASH_UZ_NOW.sh
```

## 📋 Script Nima Qiladi?

1. ✅ Git'dan yangilanishlarni oladi
2. ✅ Dependencies o'rnatadi
3. ✅ Prisma generate qiladi
4. ✅ Production build qiladi
5. ✅ PM2'ni ishga tushiradi
6. ✅ Port 3000 ni tekshiradi
7. ✅ Localhost:3000 ni test qiladi
8. ✅ Nginx konfiguratsiyasini yaratadi va sozlaydi
9. ✅ Nginx'ni ishga tushiradi
10. ✅ Firewall portlarini ochadi

## 🔍 Tekshirish

Script yakunlangandan keyin:

```bash
# PM2
pm2 status

# Port 3000
netstat -tulpn | grep 3000

# Port 80
netstat -tulpn | grep :80

# Nginx
systemctl status nginx

# Localhost test
curl -I http://localhost:3000
```

## ⚠️ Agar Hali Ham Ishlamasa

### 1. DNS Tekshirish

```bash
# DNS tekshirish
dig rash.uz

# Server IP
curl ifconfig.me
```

Agar DNS sozlanmagan bo'lsa:
- Domen provayderingizga kiring
- DNS sozlamalariga o'ting
- A record qo'shing: `rash.uz` → `SERVER_IP`
- A record qo'shing: `www.rash.uz` → `SERVER_IP`

### 2. Loglar Tekshirish

```bash
# PM2 loglar
pm2 logs rash --lines 50

# Nginx error loglar
tail -f /var/log/nginx/rash.uz.error.log

# Nginx access loglar
tail -f /var/log/nginx/rash.uz.access.log
```

### 3. Qo'lda Tekshirish

```bash
# PM2 restart
cd /var/www/rash
pm2 restart rash

# Nginx restart
systemctl restart nginx

# Port tekshirish
netstat -tulpn | grep -E ":80|:3000"
```

## 📝 Muhim Eslatmalar

1. **DNS sozlash** - Agar DNS sozlanmagan bo'lsa, sayt ochilmaydi
2. **Port 3000** - Next.js serveri ishlashi kerak
3. **Port 80** - Nginx ishlashi kerak
4. **PM2** - rash process "online" bo'lishi kerak

## ✅ Muvaffaqiyatli Bo'lgandan Keyin

- ✅ PM2 status: `rash` process `online`
- ✅ Port 3000: ochiq va ishlayapti
- ✅ Port 80: ochiq va ishlayapti
- ✅ Nginx: `active (running)`
- ✅ http://localhost:3000: ishlayapti
- ✅ http://rash.uz: ishlayapti (agar DNS sozlangan bo'lsa)
