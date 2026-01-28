# localtunnel Sozlash (Bepul va Oson)

localtunnel - npm orqali o'rnatiladigan bepul tunnel.

## 1. localtunnel O'rnatish

```bash
npm install -g localtunnel
```

## 2. Tunnel Ishga Tushirish

```bash
lt --port 3000 --subdomain rash
```

Bu sizga `https://rash.loca.lt` URL beradi.

## 3. O'z Domain'ni Ishlatish

localtunnel bepul planida o'z domain'ni ishlatish mumkin emas.

## 4. Windows Service Qilib Sozlash

PM2 orqali:

```bash
npm install -g pm2
pm2 start "lt --port 3000 --subdomain rash" --name tunnel
pm2 save
```
