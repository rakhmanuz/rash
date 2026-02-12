# rash.com.uz – Google Apps Script sozlash

To'lovlar avtomatik ravishda Google Sheets'ga yozilishi uchun Apps Script Web App yaratish.

## 1. Google Sheets'da Apps Script ochish

1. To'lovlar jadvali bo'lgan Google Sheets'ni oching
2. **Extensions** → **Apps Script**
3. Yangi skript ochiladi

## 2. Kod qo'shish

Barcha mavjud kodni o'chirib, quyidagilarni qo'ying:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Yangi qator: Sana | O'quvchi ID | Ism | Guruh | Summa
    const row = [
      data.date || new Date().toISOString(),
      data.studentId || '',
      data.name || '',
      data.groupName || '',
      data.amount || 0
    ];
    
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## 3. Deploy qilish

1. **Deploy** → **New deployment**
2. **Select type** → **Web app**
3. Sozlamalar:
   - **Description**: rash.com.uz to'lovlar
   - **Execute as**: Me (sizning hisobingiz)
   - **Who has access**: Anyone (barcha foydalanuvchilar – POST qilishi mumkin)
4. **Deploy** tugmasini bosing
5. **Web app URL** ni nusxalang (masalan: `https://script.google.com/macros/s/AKfycb.../exec`)

## 4. .env ga qo'shish

Serverdagi `.env` yoki `.env.local` fayliga:

```
RASH_GOOGLE_APPS_SCRIPT_URL="https://script.google.com/macros/s/SIZNING_URL/exec"
```

## 5. Sheet struktura (ixtiyariy)

Agar birinchi qator sarlavha bo'lsa, quyidagicha bo'lishi mumkin:

| Sana | O'quvchi ID | Ism | Guruh | Summa |
|------|-------------|-----|-------|-------|
| ...  | RASH-001    | ... | ...   | 500000|

Apps Script har safar yangi qatorni pastga qo'shadi.

## Eslatma

- `.env` da `RASH_GOOGLE_APPS_SCRIPT_URL` bo'lmasa, to'lov faqat ma'lumotlar bazasiga saqlanadi, Google Sheets'ga yozilmaydi.
