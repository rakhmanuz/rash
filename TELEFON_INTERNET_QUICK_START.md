# Telefon Internet - Tezkor Boshlash

## Eng Oson Yechim: ngrok

### 1. ngrok O'rnatish (Bir Marta)

1. **https://ngrok.com/** ga kiring va account yarating
2. **https://ngrok.com/download** dan Windows uchun yuklab oling
3. `ngrok.exe` ni `C:\ngrok\` papkasiga ko'chiring
4. `setup-ngrok-simple.bat` faylini ishga tushiring va authtoken kiriting

### 2. Server Ishga Tushirish

```bash
cd C:\IQMax
npm run build
pm2 start ecosystem.config.js
```

### 3. ngrok Ishga Tushirish

`start-ngrok-simple.bat` faylini ishga tushiring

Yoki qo'lda:
```bash
cd C:\ngrok
ngrok http 3000
```

### 4. URL Olish

Browser'da oching: **http://localhost:4040**

Forwarding URL'ni ko'rasiz (masalan: `https://abc123.ngrok-free.app`)

### 5. Domain'ni Yo'naltirish

Domain provayderingizda (DNS menejer):
- **CNAME Record** qo'shing
- **Name:** `@`
- **Type:** `CNAME`
- **Value:** ngrok URL (masalan: `abc123.ngrok-free.app`)
- **TTL:** `3600`

### 6. Tekshirish

5-10 daqiqa kutib turing, keyin:
- `http://rash.uz` yoki
- To'g'ridan-to'g'ri ngrok URL

---

## Boshqa Variant: localtunnel

Agar ngrok ishlamasa:

```bash
npm install -g localtunnel
lt --port 3000 --subdomain rash
```

Bu `https://rash.loca.lt` URL beradi.

---

## Avtomatik Ishga Tushirish

PM2 orqali ngrok'ni avtomatik ishga tushirish:

```bash
pm2 start "ngrok http 3000" --name ngrok
pm2 save
```
