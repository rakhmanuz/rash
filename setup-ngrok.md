# ngrok Tunnel Sozlash (Oson Yechim)

ngrok - eng oson va tez tunnel xizmati.

## 1. ngrok O'rnatish

1. https://ngrok.com/ ga kiring
2. Bepul account yarating
3. Dashboard'dan authtoken oling
4. ngrok yuklab oling: https://ngrok.com/download

## 2. ngrok Sozlash

```bash
# Authtoken sozlash
ngrok config add-authtoken YOUR_AUTH_TOKEN

# Tunnel ishga tushirish
ngrok http 3000
```

## 3. Domain Sozlash (ixtiyoriy)

ngrok bepul planida random URL beradi (masalan: `https://abc123.ngrok.io`)

Agar o'z domainingizni ishlatmoqchi bo'lsangiz:
1. ngrok Pro plan sotib oling
2. Domain'ni ngrok'ga ulang

## 4. Windows Service Qilib Sozlash

`ngrok-start.bat` fayl yaratish:

```batch
@echo off
cd C:\path\to\ngrok
ngrok http 3000
```
