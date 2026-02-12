# Serverda tekshirish – rash.com.uz ishlamasa

Quyidagilarni **ketma-ket** serverda bajaring:

## 1. Loyiha papkasi

```bash
cd /var/www/rash
# yoki
cd ~/rash
# yoki - qayerda rash loyihasi bo'lsa
pwd
```

## 2. PM2 da nimalar ishlayapti?

```bash
pm2 status
```

**Kutilgan natija:**
```
rash          | online | 0  | ... | 3000
rash-payment  | online | 1  | ... | 3001
```

Agar **rash-payment** yo'q bo'lsa – u ishga tushmagan.

## 3. Port 3001 ochiqmi?

```bash
curl -I http://localhost:3001/
```

- **302** yoki **200** – port ishlayapti
- **Connection refused** – port 3001 da hech narsa yo'q (rash-payment ishlamayapti)

## 4. rash-payment ni qo'lda ishga tushirish

```bash
cd /var/www/rash

# Barcha processlarni to'xtatish
pm2 delete all

# Yangidan ishga tushirish
pm2 start ecosystem.config.js --env production

pm2 save
pm2 status
```

## 5. Nginx – rash.com.uz qayerga yo'naltirilgan?

```bash
cat /etc/nginx/sites-available/rash.com.uz | grep proxy_pass
```

**Bo'lishi kerak:** `proxy_pass http://127.0.0.1:3001;`

Agar **3000** bo'lsa – xato. 3001 qilish kerak.

```bash
sudo nano /etc/nginx/sites-available/rash.com.uz
# proxy_pass http://127.0.0.1:3001; qiling

sudo nginx -t
sudo systemctl reload nginx
```

## 6. Deploy skriptni ishlatish

```bash
cd /var/www/rash
chmod +x scripts/deploy-rash-com-uz.sh
./scripts/deploy-rash-com-uz.sh
```

## 7. Loglarni ko'rish

```bash
pm2 logs rash-payment --lines 50
```

Xatolik bo'lsa shu yerda ko'rinadi.
