# VPS'ga Deploy Qilish - rash.uz

## 📋 Talablar

- VPS IP manzili
- SSH kirish (root yoki boshqa user)
- Domain: rash.uz (ulangan)

---

## 🚀 1-QADAM: Kodni VPS'ga yuklash

### Variant A: Git orqali (Tavsiya etiladi)

**Kompyuteringizda (PowerShell):**
```powershell
cd C:\IQMax

# Git'ni ishga tushirish (agar hali qilmagan bo'lsangiz)
git init
git add .
git commit -m "Production ready"

# GitHub'ga yuklash (agar repo yaratgan bo'lsangiz)
git remote add origin https://github.com/YOUR_USERNAME/iqmax.git
git push -u origin main
```

**VPS'da (SSH terminalda):**
```bash
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/iqmax.git rash
cd rash
```

### Variant B: SCP orqali (To'g'ridan-to'g'ri)

**Kompyuteringizda (PowerShell):**
```powershell
cd C:\IQMax

# ZIP yaratish (agar hali qilmagan bo'lsangiz)
# node_modules va .next ni exclude qilish
Compress-Archive -Path app,components,lib,middleware.ts,next.config.js,package.json,package-lock.json,postcss.config.js,prisma,public,scripts,server.js,ecosystem.config.js,tailwind.config.js,tsconfig.json,types,.gitignore -DestinationPath iqmax-vps.zip -Force

# VPS'ga yuborish
scp iqmax-vps.zip root@VPS_IP:/tmp/iqmax-vps.zip
```

**VPS'da:**
```bash
sudo mkdir -p /var/www/rash
cd /var/www/rash
sudo unzip /tmp/iqmax-vps.zip
rm /tmp/iqmax-vps.zip
```

---

## 🔧 2-QADAM: VPS'da sozlash

### Node.js va PM2 o'rnatish

```bash
# Node.js 18+ o'rnatish
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 o'rnatish
sudo npm i -g pm2

# Proyekt papkasiga o'tish
cd /var/www/rash
```

### Dependencies o'rnatish

```bash
npm ci
```

### .env fayl yaratish

```bash
nano .env
```

`.env` ichiga quyidagilarni kiriting:
```env
DATABASE_URL="file:./prisma/production.db"
NEXTAUTH_URL="https://rash.uz"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NODE_ENV="production"
PORT=3000
```

**Muhim:** `NEXTAUTH_SECRET` ni o'zgartiring:
```bash
openssl rand -base64 32
```
Bu komanda bergan natijani `.env` faylga qo'ying.

### Database yaratish

```bash
npx prisma generate
npx prisma db push
```

### Admin yaratish

```bash
node scripts/create-admin.js admin123
```

**Login ma'lumotlari:**
- Login: `admin`
- Parol: `admin123`

---

## 🏗️ 3-QADAM: Build va ishga tushirish

```bash
# Build
npm run build

# PM2 orqali ishga tushirish
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**PM2 komandalar:**
```bash
pm2 status          # Holatni ko'rish
pm2 logs rash       # Loglarni ko'rish
pm2 restart rash    # Qayta ishga tushirish
pm2 stop rash       # To'xtatish
```

---

## 🌐 4-QADAM: Nginx sozlash

### Nginx o'rnatish

```bash
sudo apt update
sudo apt install -y nginx
```

### Nginx konfiguratsiya

```bash
sudo nano /etc/nginx/sites-available/rash.uz
```

Quyidagilarni kiriting:
```nginx
server {
    listen 80;
    server_name rash.uz www.rash.uz;

    client_max_body_size 10M;

    # Static fayllar
    location /_next/static {
        alias /var/www/rash/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Uploads
    location /uploads {
        alias /var/www/rash/public/uploads;
        expires 30d;
        add_header Cache-Control "public";
    }

    # Next.js server'ga proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Nginx'ni faollashtirish

```bash
sudo ln -s /etc/nginx/sites-available/rash.uz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 5-QADAM: SSL sertifikat (HTTPS)

### Certbot o'rnatish

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### SSL sertifikat olish

```bash
sudo certbot --nginx -d rash.uz -d www.rash.uz
```

Certbot avtomatik ravishda Nginx konfiguratsiyasini yangilaydi.

---

## ✅ Tekshirish

1. **Sayt ishlayaptimi?**
   - https://rash.uz ga kiring

2. **PM2 ishlayaptimi?**
   ```bash
   pm2 status
   ```

3. **Nginx ishlayaptimi?**
   ```bash
   sudo systemctl status nginx
   ```

---

## 🔄 Keyingi o'zgarishlarni yuklash

### Git orqali:

**Kompyuteringizda:**
```powershell
git add .
git commit -m "Yangi o'zgarishlar"
git push
```

**VPS'da:**
```bash
cd /var/www/rash
git pull
npm ci
npm run build
pm2 restart rash
```

---

## 🆘 Muammolarni hal qilish

### Port 3000 band?

```bash
# Qaysi process port 3000 ni ishlatayotganini topish
sudo lsof -i :3000

# Process'ni to'xtatish
sudo kill -9 PID
```

### Database xatolik?

```bash
cd /var/www/rash
npx prisma db push
npx prisma generate
pm2 restart rash
```

### Loglarni ko'rish

```bash
pm2 logs rash --lines 100
```

---

## 📝 Eslatmalar

- `.env` fayl hech qachon Git'ga yuklanmaydi (xavfsizlik)
- Production'da `NEXTAUTH_SECRET` ni kuchli qiling
- Database backup qiling: `cp prisma/production.db prisma/backup-$(date +%Y%m%d).db`
- PM2 avtomatik restart qiladi agar server qayta ishga tushsa
