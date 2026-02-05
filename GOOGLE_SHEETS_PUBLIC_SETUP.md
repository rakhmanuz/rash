# Google Sheets Public Link Sozlash

Bu qo'llanma Google Sheets'ni public qilib, link orqali o'qishni tushuntiradi.

## 📋 Talablar

1. Google Sheets spreadsheet
2. Spreadsheet'ni public qilish (yoki API key)

## 🚀 Sozlash

### Variant 1: Public Link (Eng Oddiy)

1. **Google Sheets'ni oching**
2. **"Настройки Доступа" (Access Settings)** tugmasini bosing
3. **"Изменить на "Все, у кого есть ссылка""** ni tanlang
4. **"Читатель" (Viewer)** ni tanlang
5. **Link ni nusxalang**

Masalan: `https://docs.google.com/spreadsheets/d/1ABC123.../edit`

6. **`.env` fayliga qo'shing:**

```env
# Google Sheets Public Link
GOOGLE_SHEETS_PUBLIC_URL="https://docs.google.com/spreadsheets/d/1ABC123.../edit"
GOOGLE_SHEETS_SHEET_NAME="matematika"  # Sheet nomi (masalan: matematika, fizika)
```

### Variant 2: API Key (Ixtiyoriy)

Agar public link ishlamasa, API key ishlatishingiz mumkin:

1. **Google Cloud Console** ga kiring: https://console.cloud.google.com/
2. **Yangi loyiha yarating** yoki mavjud loyihani tanlang
3. **"APIs & Services" > "Credentials"** ga kiring
4. **"Create Credentials" > "API Key"** ni tanlang
5. **API Key ni nusxalang**
6. **"APIs & Services" > "Library"** ga kiring
7. **"Google Sheets API"** ni qidiring va **"Enable"** qiling
8. **Spreadsheet ID ni oling** (linkdan: `/spreadsheets/d/SPREADSHEET_ID/`)

9. **`.env` fayliga qo'shing:**

```env
# Google Sheets API Key
GOOGLE_SHEETS_API_KEY="AIzaSy..."
GOOGLE_SHEETS_SPREADSHEET_ID="1ABC123..."
GOOGLE_SHEETS_SHEET_NAME="matematika"
```

## 📊 Spreadsheet Format

Spreadsheet quyidagi formatda bo'lishi kerak:

| № | F.I.O | ID | ... | To'lov | To'landi | Holat |
|---|-------|----|-----|--------|----------|-------|
| 1 | ...   | 123| ... | ...    | ...      | -5000 |
| 2 | ...   | 456| ... | ...    | ...      | 10000 |

**Muhim:**
- **C ustuni** = O'quvchi ID (studentId)
- **S ustuni** = To'lov holati
  - **Manfiy son** = Qarzdorlik (masalan: -5000)
  - **Musbat son** = Ortiqcha to'lov (masalan: 10000)
  - **0** = To'liq to'langan

## 🔄 Sync Qilish

Admin panelda **"Sync qilish"** tugmasini bosing. Tizim:
1. Google Sheets'dan C va S ustunlarini o'qiydi
2. Har bir o'quvchi uchun:
   - **Manfiy son** bo'lsa → OVERDUE to'lov yaratadi/yangilaydi
   - **Musbat son** bo'lsa → PAID to'lov yaratadi (ortiqcha to'lov)
   - **0** bo'lsa → Hech narsa qilmaydi

## ⚠️ Eslatmalar

1. **Public link** ishlatayotgan bo'lsangiz, spreadsheet ochiq bo'lishi kerak
2. **API key** ishlatayotgan bo'lsangiz, Google Sheets API enable qilingan bo'lishi kerak
3. **Sheet nomi** to'g'ri bo'lishi kerak (masalan: "matematika", "fizika")
4. **O'quvchi ID** (C ustuni) database'dagi `studentId` ga mos kelishi kerak

## 🐛 Muammolarni Hal Qilish

### Xatolik: "Google Sheets client topilmadi"
- `.env` faylida `GOOGLE_SHEETS_PUBLIC_URL` yoki `GOOGLE_SHEETS_API_KEY` borligini tekshiring

### Xatolik: "Spreadsheet ID topilmadi"
- Link to'g'ri formatda ekanligini tekshiring
- Yoki `GOOGLE_SHEETS_SPREADSHEET_ID` ni to'g'ridan-to'g'ri qo'shing

### Xatolik: "HTTP 403"
- Spreadsheet public ekanligini tekshiring
- Yoki API key to'g'ri ekanligini tekshiring

### Xatolik: "Sheet topilmadi"
- `GOOGLE_SHEETS_SHEET_NAME` to'g'ri ekanligini tekshiring
- Sheet nomi aniq mos kelishi kerak (katta/kichik harflar)

## 📝 Misol

```env
# .env fayl
GOOGLE_SHEETS_PUBLIC_URL="https://docs.google.com/spreadsheets/d/1ABC123xyz/edit"
GOOGLE_SHEETS_SHEET_NAME="matematika"
```

Yoki:

```env
# .env fayl
GOOGLE_SHEETS_API_KEY="AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz"
GOOGLE_SHEETS_SPREADSHEET_ID="1ABC123xyz"
GOOGLE_SHEETS_SHEET_NAME="matematika"
```
