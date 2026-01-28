# Tezkor Tunnel Sozlash (Telefon Internet uchun)

## Eng Oson Yechim: ngrok

### 1-qadam: ngrok Account
1. https://ngrok.com/ ga kiring
2. "Sign up" tugmasini bosing (bepul)
3. Email va parol bilan ro'yxatdan o'ting

### 2-qadam: ngrok Yuklab Olish
1. https://ngrok.com/download ga kiring
2. Windows x64 uchun yuklab oling
3. Zip faylni ochib, `ngrok.exe` ni `C:\ngrok\` papkasiga ko'chiring

### 3-qadam: Authtoken Olish
1. https://dashboard.ngrok.com/get-started/your-authtoken ga kiring
2. Authtoken'ni nusxalab oling

### 4-qadam: ngrok Sozlash
```bash
cd C:\ngrok
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 5-qadam: Tunnel Ishga Tushirish
```bash
ngrok http 3000
```

### 6-qadam: URL Olish
ngrok ishga tushgandan keyin, terminal'da quyidagicha ko'rasiz:

```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

Bu `https://abc123.ngrok.io` URL sizning serveringizga yo'naltiriladi.

### 7-qadam: Domain'ni ngrok URL'ga Yo'naltirish

Domain provayderingizda:
1. DNS menejerga kiring
2. CNAME Record qo'shing:
   - **Name:** `@`
   - **Type:** `CNAME`
   - **Value:** `abc123.ngrok.io` (ngrok bergan URL)
   - **TTL:** `3600`

Yoki:
- **Name:** `www`
- **Type:** `CNAME`
- **Value:** `abc123.ngrok.io`

### 8-qadam: Windows Service Qilib Sozlash

`ngrok-start.bat` fayl yaratish:

```batch
@echo off
cd C:\ngrok
ngrok http 3000
```

Yoki PM2 orqali:

```bash
npm install -g pm2
pm2 start "ngrok http 3000" --name ngrok
pm2 save
```

## Muammo: ngrok URL Har Safar O'zgaradi

Bepul planida ngrok URL har safar o'zgaradi. Yechim:

1. **ngrok Pro plan sotib oling** ($8/oy) - o'z domain'ni ishlatish mumkin
2. Yoki **localtunnel** ishlating - subdomain sozlab bo'ladi

## Boshqa Variant: localtunnel

```bash
npm install -g localtunnel
lt --port 3000 --subdomain rash
```

Bu `https://rash.loca.lt` URL beradi (subdomain har safar bir xil bo'ladi).

## Eng Yaxshi Yechim: Cloudflare Tunnel (Bepul va Doimiy)

Cloudflare Tunnel bepul va o'z domain'ni ishlatish mumkin. Lekin sozlash biroz murakkab.

Batafsil: `setup-cloudflare-tunnel.md` faylini o'qing.
