# ✅ DNS Sozlamalarini Tekshirish

## 📋 Hozirgi DNS Sozlamalari

Sizning DNS sozlamalaringiz:
- ✅ A record: `@` → `144.91.108.158`
- ✅ CNAME: `www` → `rash.uz`

## 🔍 Server IPv4 IP'ni Tekshirish

Serverda quyidagi buyruqni bajaring:

```bash
# Server IPv4 IP'ni aniqlash
curl -4 ifconfig.me
# yoki
curl -4 icanhazip.com
# yoki
hostname -I | awk '{for(i=1;i<=NF;i++) if($i !~ /:/) print $i; exit}'
```

## ✅ Tekshirish

Agar server IPv4 IP `144.91.108.158` bo'lsa:
- ✅ DNS to'g'ri sozlangan
- ✅ Sayt ishlashi kerak

Agar server IPv4 IP boshqa bo'lsa:
- ❌ DNS'ni yangilash kerak
- ❌ A record'ni yangi IP'ga o'zgartirish kerak

## 🚀 To'liq Tekshirish

Serverda quyidagi scriptni ishga tushiring:

```bash
# 1. Serverga SSH orqali ulaning
ssh root@rash.uz

# 2. Papkaga o'tish
cd /var/www/rash

# 3. Git pull
git pull origin main

# 4. Status tekshirish
chmod +x CHECK_RASH_UZ_STATUS.sh
./CHECK_RASH_UZ_STATUS.sh
```

Script quyidagilarni ko'rsatadi:
- Server IPv4 IP
- DNS IP
- Mos kelishi yoki kelmasligi
- Qanday tuzatish kerakligi

## ⏱️ DNS O'zgarishlari

DNS o'zgarishlari 5-30 daqiqa ichida kuchga kiradi. Agar yangi sozlash bo'lsa, biroz kutish kerak.

## 🔄 DNS Cache Tozalash

Agar DNS o'zgarishlaridan keyin hali ham eski IP ko'rsatilsa:

```bash
# Local DNS cache tozalash (Windows)
ipconfig /flushdns

# Local DNS cache tozalash (Linux/Mac)
sudo systemd-resolve --flush-caches
# yoki
sudo resolvectl flush-caches
```

## ✅ Muvaffaqiyatli Bo'lgandan Keyin

- ✅ `dig rash.uz` → `144.91.108.158` ko'rsatishi kerak
- ✅ `curl -I http://rash.uz` → HTTP 200 yoki 301/302
- ✅ Browser'da rash.uz ochilishi kerak
