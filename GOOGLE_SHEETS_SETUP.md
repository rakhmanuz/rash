# Google Sheets Integratsiyasi - Sozlash

## Umumiy ma'lumot

Google Sheets integratsiyasi to'lovlar bo'limida ishlatiladi. Tizim Google Sheets'dan faqat ma'lumotlarni o'qiydi (read-only). Barcha hisob-kitoblar Google Sheets'da bo'ladi.

## Sozlash

### 1. Google Sheets'ni Public qilish

1. Google Sheets'ni oching
2. **File** → **Share** → **Publish to web**
3. **Link** tab'ni tanlang
4. **Entire document** yoki **Sheet** ni tanlang
5. **Web page** formatini tanlang
6. **Publish** tugmasini bosing
7. Linkni nusxalang (masalan: `https://docs.google.com/spreadsheets/d/e/2PACX-.../pubhtml`)

### 2. Environment Variables

Serverdagi `.env` fayliga quyidagilarni qo'shing:

```bash
# Google Sheets Public Link
GOOGLE_SHEETS_PUBLIC_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vQhB-RMHoKIm4jxNeNcJmM3AQI2H5ZKmOoftmvQez0K6vPogRnriO_UYEGh4YCM3j8N3HSm9Qfw-fdG/pubhtml"

# Sheet nomi (ixtiyoriy, default: "To'lovlar")
GOOGLE_SHEETS_SHEET_NAME="To'lovlar"
```

### 3. Ma'lumotlar strukturi

Google Sheets'da quyidagi struktura bo'lishi kerak:

- **C ustun**: O'quvchi ID (Student ID)
- **S ustun**: To'lov holati (Payment Status)
  - **Manfiy son** (-100, -500, ...) → Qarzdorlik (Debt)
  - **Musbat son** (100, 500, ...) → Ortiqcha to'lov (Overpayment)
  - **Nol** (0) → To'lov balansi

### 4. Serverga yuklash

```bash
# 1. Git'ga commit qiling
git add .
git commit -m "Google Sheets integratsiyasi"
git push origin main

# 2. Serverga ulaning
ssh user@your-server

# 3. Deployment skriptini ishga tushiring
cd /var/www/rash
bash DEPLOY_TO_SERVER.sh
```

### 5. Test qilish

1. Admin panel → **To'lovlar** bo'limiga kiring
2. **"Google Sheets"** tugmasini bosing (ma'lumotlarni yuklash uchun)
3. **"Sync from Sheets"** tugmasini bosing (ma'lumotlarni database'ga sinxronlash uchun)

## Qo'llab-quvvatlanadigan link formatlari

1. **Published link** (tavsiya etiladi):
   ```
   https://docs.google.com/spreadsheets/d/e/2PACX-.../pubhtml
   ```

2. **Oddiy spreadsheet link**:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```

3. **To'g'ridan-to'g'ri CSV export link**:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/export?format=csv&gid=0
   ```

## Muammolarni hal qilish

### Xatolik: "Google Sheets URL dan ID ajratib bo'lmadi"

- Published link ishlatayotgan bo'lsangiz, link `/pubhtml` bilan tugashini tekshiring
- Link to'g'ri formatda ekanligini tekshiring

### Xatolik: "HTTP 403" yoki "HTTP 404"

- Google Sheets'ni public qilganingizni tekshiring
- Link to'g'ri ekanligini tekshiring
- Internet ulanishini tekshiring

### Ma'lumotlar ko'rinmayapti

- Sheet nomini tekshiring (`GOOGLE_SHEETS_SHEET_NAME`)
- C va S ustunlarida ma'lumotlar borligini tekshiring
- Browser console'da xatoliklarni tekshiring
