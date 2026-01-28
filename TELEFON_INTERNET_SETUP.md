# Telefon Orqali Internet - Batafsil Qo'llanma

## Nima uchun Tunnel Kerak?

Telefon orqali USB tethering/hotspot orqali internet ulanayotgan bo'lsangiz:
- Router yo'q
- Port Forwarding qilish mumkin emas
- Public IP doimiy emas
- Operator NAT orqali internet beradi

**Yechim:** Tunnel xizmati (ngrok, localtunnel, Cloudflare Tunnel)

---

## Variant 1: ngrok (Tavsiya Etiladi)

### Qadam 1: ngrok Account Yaratish

1. Browser'da oching: **https://ngrok.com/**
2. Yuqori o'ng burchakda **"Sign up"** tugmasini bosing
3. Email va parol bilan ro'yxatdan o'ting (bepul)
4. Email'ni tasdiqlang

### Qadam 2: ngrok Yuklab Olish

1. **https://ngrok.com/download** ga kiring
2. **Windows** bo'limida **"Download for Windows"** tugmasini bosing
3. Zip faylni yuklab oling
4. Zip faylni ochib, `ngrok.exe` faylini toping
5. `ngrok.exe` ni quyidagi papkaga ko'chiring:
   ```
   C:\ngrok\ngrok.exe
   ```

### Qadam 3: Authtoken Olish

1. **https://dashboard.ngrok.com/get-started/your-authtoken** ga kiring
2. Login qiling
3. Authtoken'ni ko'rasiz (masalan: `PGHXTY5DUISQAFAYNRFVYOMXHKA7YOLL`)
4. Authtoken'ni nusxalab oling

### Qadam 4: ngrok Sozlash

1. Command Prompt yoki PowerShell'ni oching
2. Quyidagi buyruqni bajaring:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```
   (YOUR_AUTH_TOKEN o'rniga sizning authtoken'ingizni kiriting)

### Qadam 5: Server Ishga Tushirish

1. Avval serveringizni ishga tushiring:
   ```bash
   cd C:\IQMax
   npm run build
   pm2 start ecosystem.config.js
   ```

2. Keyin ngrok'ni ishga tushiring:
   ```bash
   ngrok http 3000
   ```

### Qadam 6: ngrok URL Olish

ngrok ishga tushgandan keyin, terminal'da quyidagicha ko'rasiz:

```
ngrok                                                                               

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123-def456.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Muhim:** `Forwarding` qatoridagi URL'ni yozib oling (masalan: `https://abc123-def456.ngrok-free.app`)

### Qadam 7: ngrok Web Interface

Browser'da oching: **http://localhost:4040**

Bu yerda:
- Barcha so'rovlar ko'rinadi
- Forwarding URL ko'rsatiladi
- Real-time monitoring

### Qadam 8: Domain'ni ngrok URL'ga Yo'naltirish

1. Domain provayderingizga kiring (DNS menejer)
2. **CNAME Record** qo'shing:
   - **Name:** `@` (yoki bo'sh qoldiring)
   - **Type:** `CNAME`
   - **Value:** `abc123-def456.ngrok-free.app` (ngrok bergan URL)
   - **TTL:** `3600`

3. Yoki **www** uchun:
   - **Name:** `www`
   - **Type:** `CNAME`
   - **Value:** `abc123-def456.ngrok-free.app`
   - **TTL:** `3600`

4. **Saqlang**

### Qadam 9: Tekshirish

1. 5-10 daqiqa kutib turing (DNS propagatsiya)
2. Browser'da oching:
   - `http://rash.uz`
   - Yoki to'g'ridan-to'g'ri ngrok URL: `https://abc123-def456.ngrok-free.app`

---

## Variant 2: localtunnel (Bepul, npm orqali)

### Qadam 1: localtunnel O'rnatish

```bash
npm install -g localtunnel
```

### Qadam 2: Tunnel Ishga Tushirish

```bash
lt --port 3000 --subdomain rash
```

Bu sizga quyidagicha URL beradi:
```
https://rash.loca.lt
```

### Qadam 3: Domain'ni Yo'naltirish

Domain provayderingizda CNAME Record qo'shing:
- **Name:** `@`
- **Type:** `CNAME`
- **Value:** `rash.loca.lt`
- **TTL:** `3600`

### Qadam 4: PM2 orqali Avtomatik Ishga Tushirish

```bash
pm2 start "lt --port 3000 --subdomain rash" --name tunnel
pm2 save
```

---

## Variant 3: Cloudflare Tunnel (Bepul, O'z Domain Bilan)

Bu eng yaxshi yechim, lekin biroz murakkab. Batafsil: `setup-cloudflare-tunnel.md`

---

## Muammolar va Yechimlar

### Muammo 1: ngrok URL Har Safar O'zgaradi

**Yechim:** 
- ngrok bepul planida URL har safar o'zgaradi
- Yechim: **ngrok Pro plan** ($8/oy) - o'z domain'ni ishlatish mumkin
- Yoki **localtunnel** ishlating - subdomain doimiy bo'ladi

### Muammo 2: ngrok "Too Many Connections" Xatosi

**Yechim:**
- Bepul planda cheklov bor
- ngrok Pro plan sotib oling
- Yoki localtunnel ishlating

### Muammo 3: Domain Ishlamayapti

**Yechim:**
- DNS propagatsiya vaqti (24-48 soat)
- DNS cache'ni tozalash: `ipconfig /flushdns`
- CNAME Record to'g'ri qo'shilganligini tekshiring

### Muammo 4: Server Ishlamayapti

**Yechim:**
```bash
# PM2 status tekshirish
pm2 status

# Loglar
pm2 logs rash

# Qayta ishga tushirish
pm2 restart rash
```

---

## Avtomatik Ishga Tushirish (Windows Service)

### ngrok uchun:

`start-ngrok.bat` fayl yaratish:

```batch
@echo off
cd C:\ngrok
ngrok http 3000
```

Yoki PM2 orqali:

```bash
pm2 start "ngrok http 3000" --name ngrok
pm2 save
```

### localtunnel uchun:

```bash
pm2 start "lt --port 3000 --subdomain rash" --name tunnel
pm2 save
```

---

## Qaysi Variantni Tanlash?

1. **ngrok** - Eng oson, tez sozlash, lekin URL o'zgaradi (bepul plan)
2. **localtunnel** - Bepul, subdomain doimiy, npm orqali
3. **Cloudflare Tunnel** - Bepul, o'z domain, lekin murakkab sozlash

**Tavsiya:** Avval **ngrok** bilan boshlang, keyin kerak bo'lsa boshqa variantlarga o'ting.
