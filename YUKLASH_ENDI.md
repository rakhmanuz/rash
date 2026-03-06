# 🚀 Rash.uz serverga yuklash (hozir)

## 1. Kompyuteringizda — Git'ga push

```powershell
cd C:\IQMax
git add -A
git commit -m "To'lovlar: qarzdorlik Google Sheets dan, deploy hujjatlar yangilandi"
git push origin main
```

## 2. Serverda (rash.uz) — .env ga qator qo'shish

SSH orqali kirib, loyiha papkasidagi `.env` yoki `.env.local` fayliga quyidagi qatorni qo'shing (agar yo'q bo'lsa):

```bash
ssh root@rash.uz
# yoki: ssh username@rash.uz

cd /var/www/rash
nano .env
```

Quyidagi qatorni **fayl oxiriga** qo'shing (Ctrl+O saqlash, Ctrl+X chiqish):

```env
SHEET_DEBT_SCRIPT_URL=https://script.google.com/macros/s/AKfycbwTeLM_tEtGAJxK_D2gxVPVaZLINAQYr1ALaZY_7SwEP5pOs4QLUaPpI9NgVseIzd3x/exec
```

Agar serverda `.env` o'rniga `.env.local` ishlatilsa — xuddi shu qatorni `.env.local` ga qo'shing.

## 3. Serverda — kod yangilash va restart

```bash
cd /var/www/rash

# Variant A: deploy script (tavsiya)
chmod +x scripts/deploy-to-rash-uz.sh
./scripts/deploy-to-rash-uz.sh
```

**Yoki qo'lda:**

```bash
cd /var/www/rash
pm2 stop rash
git pull origin main
npm ci
npx prisma generate
npx prisma db push --accept-data-loss 2>/dev/null || true
rm -rf .next
npm run build
pm2 start npm --name "rash" -- start
pm2 save
```

## 4. Tekshirish

- https://rash.uz oching
- O'quvchi hisobi bilan kiring (login = jadvaldagi ID, masalan 3736)
- **To'lovlar** sahifasiga kiring — **Qarzdorlik** Google Sheets dan kelishi kerak

---

**Qisqacha:** Kodni push qiling → serverda `.env` ga `SHEET_DEBT_SCRIPT_URL` qo'shing → serverda `./scripts/deploy-to-rash-uz.sh` yoki yuqoridagi qo'lda qadamlarni bajaring.
