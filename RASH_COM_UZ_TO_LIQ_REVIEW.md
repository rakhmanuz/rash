# rash.com.uz – To'liq tekshiruv va muammolarni bartaraf etish

## 1. Rash.com.uz qanday ishlashi kerak

| Domen | Sahifa | Kimlar |
|-------|--------|--------|
| **rash.uz** | Landing (rash.uz branding), asosiy sayt | Hammaga ochiq |
| **rash.com.uz** | To'lov login sahifa → /rash/payments | Faqat ADMIN, MANAGER, ASSISTANT_ADMIN |

---

## 2. Tizim arxitekturasi

```
rash.com.uz/    →  redirect /rash       →  app/rash/page.tsx (login)
rash.com.uz/rash →  app/rash/page.tsx   →  to'lov login
rash.com.uz/payments →  app/rash/payments  →  to'lov kiritish (auth kerak)

rash.uz/        →  app/page.tsx         →  landing (PremiumHero)
```

---

## 3. Muammo: rash.com.uz da rash.uz sahifasi chiqyapti

### Sabab 1: Nginx cache
Nginx `proxy_cache` ishlatilsa, `/` javobini cache qiladi va barcha domenlar uchun bir xil sahifani qaytaradi.

**Yechim:** Nginx da `/` uchun cache o‘chirish yoki cache key ga `$host` qo‘shish:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    # Agar proxy_cache bor bo'lsa:
    # proxy_cache_bypass $http_host;
    # proxy_no_cache $http_host;
}
```

### Sabab 2: Host header yetib kelmayapti
Nginx da `proxy_set_header Host $host` bo‘lishi shart.

**Tekshirish:**
```bash
curl -I -H "Host: rash.com.uz" http://localhost:3000/
```
`Location: /rash` bo‘lishi kerak (302 redirect). Agar 200 OK bo‘lsa, host tekshiruvi ishlamayapti.

### Sabab 3: rash.com.uz uchun alohida Nginx server blok yo‘q
rash.com.uz so‘rovlari default serverga tushadi. Default serverda ham `proxy_set_header Host $host` bo‘lishi kerak.

**rash.com.uz uchun config:**
```nginx
server {
    listen 80;
    server_name rash.com.uz www.rash.com.uz;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Sabab 4: Root page cache (Next.js)
Agar `app/page.tsx` static qilib build qilingan bo‘lsa, host tekshiruvi har so‘rovda ishlamaydi.

**Tekshirish:** `app/page.tsx` da `headers()` ishlatilgan – sahifa dynamic bo‘lishi kerak. Build dan keyin ham tekshirish:

```bash
# Serverda
cd /var/www/rash
npm run build
# Build output da / sahifa "o" (dynamic) yoki "ƒ" (dynamic) ko'rsatishi kerak
```

---

## 4. Yordamchi admin yaratish jarayoni

### API: POST /api/admin/assistant-admins
- Faqat ADMIN va MANAGER chaqira oladi
- `username`, `name`, `password` majburiy
- User yaratiladi: `role: 'ASSISTANT_ADMIN'`
- AssistantAdmin profile yaratiladi (permissions bilan)

**Bu qismda xatolik yo‘q** – yordamchi admin to‘g‘ri yaratiladi.

### rash.com.uz ga kirish (lib/auth.ts)
- Yordamchi admin faqat rash.com.uz da login qila oladi
- rash.uz da yordamchi admin login qilsa → "Login yoki parol noto'g'ri"
- rash.com.uz da login qilsa → muvaffaqiyatli

---

## 5. Qadam-baqadam tekshiruv

### Serverda:

**1. Nginx config:**
```bash
ls -la /etc/nginx/sites-enabled/
cat /etc/nginx/sites-available/rash.com.uz
```

**2. Host header tekshirish:**
```bash
curl -I -H "Host: rash.com.uz" http://localhost:3000/
# 302 va Location: http://localhost:3000/rash bo'lishi kerak
```

**3. To‘g‘ridan-to‘g‘ri /rash:**
```bash
curl -I -H "Host: rash.com.uz" http://localhost:3000/rash
# 200 OK – login sahifa
```

**4. Kod yangiligi:**
```bash
cd /var/www/rash
git log -1 --oneline
git pull
npm run build
pm2 restart rash
```

**5. Nginx cache o‘chirish (agar bor bo‘lsa):**
```bash
# Agar proxy_cache ishlatilsa
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx
```

---

## 6. Xulosa

rash.com.uz da rash.uz sahifasi chiqayotgan bo‘lsa, eng ehtimoliy sabab:

1. **Nginx cache** – `/` javobi cache’da, `$host` bo‘yicha farqlanmaydi
2. **Host header** – Nginx `proxy_set_header Host $host` qilmayapti
3. **Kod eski** – serverda yangi `app/page.tsx` va middleware yo‘q

Birinchi navbatda Nginx config va cache’ni tekshiring.
