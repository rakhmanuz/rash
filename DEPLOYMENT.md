# Server Deployment Qo'llanmasi

## 1. Production Build

```bash
npm run build
```

## 2. PM2 o'rnatish va ishga tushirish

```bash
# PM2 o'rnatish
npm install -g pm2

# Ilovani ishga tushirish
pm2 start ecosystem.config.js

# PM2 daemon sifatida ishga tushirish (kompyuter qayta ishga tushganda avtomatik ishga tushadi)
pm2 startup
pm2 save
```

## 3. PM2 boshqaruv buyruqlari

```bash
# Status ko'rish
pm2 status

# Loglarni ko'rish
pm2 logs rash

# Qayta ishga tushirish
pm2 restart rash

# To'xtatish
pm2 stop rash

# O'chirish
pm2 delete rash
```

## 4. Windows Firewall sozlash

1. Windows Defender Firewall'ni oching
2. "Advanced settings" ni tanlang
3. "Inbound Rules" > "New Rule"
4. "Port" ni tanlang
5. TCP, 3000 port (yoki boshqa port)
6. "Allow the connection" ni tanlang
7. Barcha profillarni tanlang
8. Nomi: "RASH Server"

## 5. Router sozlash (Port Forwarding)

1. Router admin paneliga kiring (odatda 192.168.1.1 yoki 192.168.0.1)
2. Port Forwarding yoki Virtual Server bo'limiga kiring
3. Yangi qoida qo'shing:
   - External Port: 80 (HTTP) va 443 (HTTPS)
   - Internal IP: Kompyuteringizning IP manzili (ipconfig orqali toping)
   - Internal Port: 3000
   - Protocol: TCP

## 6. Static IP sozlash

Kompyuteringizga static IP berish:

1. Network Settings > Change adapter options
2. Ethernet yoki Wi-Fi adapter'ni tanlang
3. Properties > Internet Protocol Version 4 (TCP/IPv4)
4. "Use the following IP address" ni tanlang
5. IP manzil, Subnet mask, Default gateway ni kiriting

## 7. Domain DNS sozlash

Domain provayderingizda DNS sozlash:

1. A Record qo'shing:
   - Name: @ (yoki www)
   - Type: A
   - Value: Sizning public IP manzilingiz (whatismyip.com orqali toping)
   - TTL: 3600

2. CNAME Record (ixtiyoriy):
   - Name: www
   - Type: CNAME
   - Value: rash.uz (yoki boshqa domain)

## 8. Nginx Reverse Proxy (Tavsiya etiladi)

Nginx o'rnatish va sozlash:

```bash
# Nginx o'rnatish (Windows uchun)
# https://nginx.org/en/download.html dan yuklab oling

# nginx.conf sozlash
```

Nginx config fayli (`nginx.conf`):

```nginx
server {
    listen 80;
    server_name rash.uz www.rash.uz;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 9. SSL Sertifikat (Let's Encrypt)

HTTPS uchun:

1. Certbot o'rnatish
2. Sertifikat olish:
```bash
certbot --nginx -d rash.uz -d www.rash.uz
```

## 10. Environment Variables

`.env.production` fayl yaratish:

```env
NODE_ENV=production
NEXTAUTH_URL=https://rash.uz
NEXTAUTH_SECRET=your-secret-key-here
DATABASE_URL=file:./dev.db
PORT=3000
HOSTNAME=0.0.0.0
```

## 11. Database Backup

Muntazam backup olish:

```bash
# Backup script yaratish
# backup.bat (Windows)
copy dev.db backup\dev_%date%.db
```

## 12. Monitoring

PM2 monitoring:

```bash
pm2 monit
```

Yoki PM2 Plus (online monitoring):
```bash
pm2 link <secret> <public>
```

## Xavfsizlik

1. Firewall faqat kerakli portlarni oching
2. Muntazam yangilanishlar
3. Kuchli parollar
4. SSL sertifikat ishlatish
5. Muntazam backup

## Muammolarni hal qilish

1. **Port ochilmagan:**
   - Firewall qoidalarini tekshiring
   - Router port forwarding'ni tekshiring

2. **Domain ishlamayapti:**
   - DNS propagatsiya vaqti (24-48 soat)
   - DNS cache'ni tozalash: `ipconfig /flushdns`

3. **Ilova ishlamayapti:**
   - PM2 loglarni tekshiring: `pm2 logs rash`
   - Port bandligini tekshiring: `netstat -ano | findstr :3000`

4. **Database xatolik:**
   - Prisma Client'ni qayta generatsiya qiling: `npx prisma generate`
   - Database fayl ruxsatlarini tekshiring
