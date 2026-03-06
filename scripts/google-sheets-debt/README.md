# Google Sheets orqali qarzdorlik (debt)

O'quvchilar panelidagi **To'lovlar** sahifasida "Qarzdorlik" qiymati Google Sheets (tolov 2.0) dan ID orqali olinadi va har daqiqa yangilanadi.

## 1. Google Sheets da script qo'shish

1. **tolov 2.0** jadvalini oching.
2. **Extensions → Apps Script**.
3. `Code.gs` faylida ushbu papkadagi `Code.gs` ning mazmunini yozing (yoki nusxa qiling).
4. Ustunlarni tekshiring:
   - `ID_COLUMN = 3` — ID ustuni (C).
   - `DEBT_COLUMN = 5` — qarzdorlik ustuni: **5** = E (Holat), **19** = S.
   - `SHEET_INDEX = 0` — birinchi varag' (masalan matematika).
5. **Deploy → New deployment → Type: Web app**:
   - **Execute as:** Me
   - **Who has access:** Anyone
6. **Deploy** bosib, **Web app URL** ni nusxalang (masalan `https://script.google.com/macros/s/.../exec`).

## 2. Loyihada sozlash

`.env` (yoki production muhitida) ga qo'shing:

```env
SHEET_DEBT_SCRIPT_URL=https://script.google.com/macros/s/SIZNING_SCRIPT_ID/exec
```

URL dan keyin `?id=3736` avtomatik qo'shiladi — sessiyadagi o'quvchi `studentId` (login) yuboriladi.

## 3. Ishlash tartibi

- O'quvchi **student** panelida **To'lovlar** ga kiradi.
- Backend sessiyadan `studentId` ni oladi va `SHEET_DEBT_SCRIPT_URL?id=<studentId>` ga so'rov yuboradi.
- Script jadvaldan shu ID li qatorni topadi va qarzdorlik ustunidagi qiymatni JSON da qaytaradi.
- Sahifada "Qarzdorlik" har daqiqa yangilanadi.

**Eslatma:** Faqat jadvalga "global" havola berish dasturga ma'lumot bermaydi; ma'lumotni olish uchun script **Web app** sifatida deploy qilingan bo'lishi kerak.
