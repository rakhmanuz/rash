# ngrok Authtoken Muammosini Hal Qilish

## Muammo

```
ERROR: authentication failed: The authtoken you specified does not look like a proper ngrok authtoken.
```

## Yechim

### 1. Yangi Authtoken Olish

1. **https://dashboard.ngrok.com/get-started/your-authtoken** ga kiring
2. Login qiling
3. Authtoken'ni ko'rasiz
4. **To'liq authtoken'ni nusxalab oling** (barcha belgilar)

### 2. Authtoken Sozlash

`fix-ngrok-auth.bat` faylini ishga tushiring va yangi authtoken kiriting.

Yoki qo'lda:

```bash
ngrok config add-authtoken YOUR_NEW_AUTHTOKEN
```

### 3. Tekshirish

```bash
ngrok version
```

Agar ishlasa, quyidagicha ko'rasiz:
```
ngrok version 3.x.x
```

### 4. Tunnel Ishga Tushirish

```bash
ngrok http 3000
```

## Muammo Bo'lsa

1. **Authtoken to'g'ri nusxalanganmi?** - Barcha belgilar, bo'sh joylar yo'q
2. **ngrok o'rnatilganmi?** - `ngrok version` buyrug'i ishlaydimi?
3. **Internet ulanmimi?** - Telefon internet ishlaydimi?

## Alternativ: localtunnel

Agar ngrok ishlamasa, localtunnel ishlating:

```bash
npm install -g localtunnel
lt --port 3000 --subdomain rash
```

Bu `https://rash.loca.lt` URL beradi.
