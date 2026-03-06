# To'lovlar (qarzdorlik) funksiyasini serverga to'liq yuklash

Bu qo'llanma — kompyuteringizdagi o'zgarishlarni rash.uz serveriga yuklash va qarzdorlik funksiyasining ishlashini ta'minlash uchun.

---

## QISM 1 — Kompyuteringizda (Windows)

### 1.1 Loyiha papkasiga o'ting

PowerShell yoki CMD oching va yozing:

```
cd C:\IQMax
```

### 1.2 Kodni Git ga yuborish

Quyidagi buyruqlarni navbat bilan yozing (har biridan keyin Enter):

```
git add -A
```

```
git commit -m "To'lovlar qarzdorlik Google Sheets dan"
```

```
git push origin main
```

**Eslatma:** Agar sizda branch nomi `master` bo'lsa, oxirgi qatorda `git push origin master` yozing.

Push muvaffaqiyatli bo'lsa, 1-qism tugadi. Serverga o'tamiz.

---

## QISM 2 — Serverga kirish

### 2.1 SSH orqali serverga ulaning

Yangi terminal (yoki PowerShell) oching va yozing:

```
ssh root@rash.uz
```

(yoki serveringizda boshqa foydalanuvchi bo'lsa: `ssh foydalanuvchi@rash.uz`)

Parol so'ralsa, server parolini kiriting. Kirgach, siz serverda bo'lasiz.

---

## QISM 3 — Serverda .env sozlash (bir marta)

Qarzdorlik funksiyasi ishlashi uchun serverda loyiha papkasidagi `.env` (yoki `.env.local`) faylida `SHEET_DEBT_SCRIPT_URL` bo'lishi kerak.

### 3.1 Loyiha papkasiga o'ting

```
cd /var/www/rash
```

(Agar loyiha boshqa joyda bo'lsa, masalan `cd /home/user/rash`, o'sha yo'lni yozing.)

### 3.2 .env faylini oching

```
nano .env
```

Agar `.env` yo'q deb xabar bersa, quyidagini sinab ko'ring:

```
nano .env.local
```

### 3.3 Yangi qator qo'shing

Fayl oxiriga (boshqa qatorlardan keyin) quyidagi qatorni qo'shing. Boshida bo'sh qator qoldirish mumkin:

```
SHEET_DEBT_SCRIPT_URL=https://script.google.com/macros/s/AKfycbx40NjpDnccze-QmIFqgr43-jatBaUO_NFMeFJMe7Ty4WBTSTmIWq0QrYWpGRfAcofT/exec
```

### 3.4 Saqlash va chiqish

- **Saqlash:** `Ctrl+O` bosing, keyin `Enter`.
- **Chiqish:** `Ctrl+X` bosing.

Shu bilan .env sozlamasi tayyor.

---

## QISM 4 — Serverda kodni yangilash va ilovani qayta ishga tushirish

### 4.1 Loyiha papkasida ekanligingizni tekshiring

```
cd /var/www/rash
```

### 4.2 Deploy script ni ishga tushiring

Avval script ga bajarish huquqi bering (faqat bir marta kerak):

```
chmod +x scripts/deploy-to-rash-uz.sh
```

Keyin script ni ishga tushiring:

```
./scripts/deploy-to-rash-uz.sh
```

Script avtomatik ravishda:
- PM2 ni to'xtatadi
- Git dan yangi kodni oladi (`git pull`)
- `npm ci` va `npx prisma generate`, `npx prisma db push` bajardi
- `npm run build` qiladi
- PM2 orqali ilovani qayta ishga tushiradi

Oxirida "Deployment muvaffaqiyatli" degan xabar chiqishi kerak.

---

### 4.3 Agar script ishlamasa — qo'lda qadamlar

Agar `./scripts/deploy-to-rash-uz.sh` xato bersa yoki ishlamasa, quyidagilarni navbat bilan bajaring:

```
cd /var/www/rash
```

```
pm2 stop rash
```

```
git pull origin main
```

```
npm ci
```

```
npx prisma generate
```

```
npx prisma db push --accept-data-loss
```
(Agar bu buyruq xato bersa, keyingi qatorga o'ting.)

```
rm -rf .next
```

```
npm run build
```

```
pm2 start npm --name "rash" -- start
```

```
pm2 save
```

---

## QISM 5 — Tekshirish

1. Brauzerda **https://rash.uz** ni oching.
2. **O'quvchi** hisobi bilan kiring (login — jadvaldagi ID, masalan 3736).
3. Menyudan **To'lovlar** (yoki "Mening to'lovlarim") sahifasiga kiring.
4. **Qarzdorlik** qatori Google Sheets jadvalidagi summani ko'rsatishi kerak va har daqiqa yangilanadi.

Agar qarzdorlik 0 ko'rinsa:
- Google Sheets da shu o'quvchi ID si (masalan 3736) va **Holat** (yoki qarzdorlik) ustunida qiymat bor-yo'qligini tekshiring.
- Serverda `.env` (yoki `.env.local`) da `SHEET_DEBT_SCRIPT_URL` to'g'ri yozilganini tekshiring.

---

## Qisqacha ro'yxat

| Qadam | Qayerda | Nima qilish |
|-------|---------|-------------|
| 1 | Kompyuter | `cd C:\IQMax` → `git add -A` → `git commit -m "..."` → `git push origin main` |
| 2 | Server | `ssh root@rash.uz` |
| 3 | Server | `cd /var/www/rash` → `nano .env` → `SHEET_DEBT_SCRIPT_URL=...` qo'shish → saqlash |
| 4 | Server | `chmod +x scripts/deploy-to-rash-uz.sh` → `./scripts/deploy-to-rash-uz.sh` |
| 5 | Brauzer | https://rash.uz → O'quvchi → To'lovlar → Qarzdorlik tekshirish |

Shu qadamlardan keyin to'lovlar (qarzdorlik) funksiyasi serverda to'liq ishlaydi.
