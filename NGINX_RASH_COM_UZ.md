# rash.com.uz – Nginx sozlash

rash.com.uz "Welcome to nginx!" ko'rsatayotgan bo'lsa, Nginx'da server blok qo'shilmagan. Quyidagilarni bajaring:

## 1. Nginx config yaratish

```bash
sudo nano /etc/nginx/sites-available/rash.com.uz
```

Quyidagini kiriting:

```nginx
server {
    listen 80;
    server_name rash.com.uz www.rash.com.uz;

    access_log /var/log/nginx/rash.com.uz.access.log;
    error_log /var/log/nginx/rash.com.uz.error.log;
    client_max_body_size 50M;

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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

## 2. Config'ni faollashtirish

```bash
sudo ln -sf /etc/nginx/sites-available/rash.com.uz /etc/nginx/sites-enabled/
```

## 3. Nginx tekshirish va qayta yuklash

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 4. SSL (HTTPS) olish (Let's Encrypt)

```bash
sudo certbot --nginx -d rash.com.uz -d www.rash.com.uz
```

Certbot config'ni avtomatik yangilaydi va "Not secure" xabari yo'qoladi.

## 5. Tekshirish

- http://rash.com.uz – login sahifa ko'rinishi kerak
- https://rash.com.uz – SSL sozlanganidan keyin

---

**Eslatma:** rash.uz va rash.com.uz ikkalasi ham bir xil Next.js ilovasiga (port 3000) yo'naltiriladi. Middleware domen bo'yicha rash.com.uz uchun to'lov interfeysini ko'rsatadi.
