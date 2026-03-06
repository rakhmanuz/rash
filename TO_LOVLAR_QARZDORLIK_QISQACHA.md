# To'lovlar sahifasi — qarzdorlik qanday ishlaydi

## Nima qildik?

**Maqsad:** O'quvchi panelida "To'lovlar" sahifasida **Qarzdorlik** (qancha qarzdor ekani) Google Sheets jadvalidan keladi. Har daqiqa yangilanadi.

---

## 3 ta qism

### 1) Google Sheets (sizda bor — "tolov 2.0")
- Jadvalda: **ID** ustuni (masalan 3736), **Holat** ustuni (qarzdorlik summa).
- Siz **Apps Script** qo'shdingiz va **veb-ilova** sifatida deploy qildingiz.
- Natija: biror kishi `https://script.google.com/.../exec?id=3736` ga kirsa, jadvaldan 3736 ID li qatorning qarzdorligi qaytadi (masalan `{"debt": 400000}`).

### 2) Loyiha kodi (IQMax / rash)
- **API:** `/api/student/debt-from-sheet` — kirgan o'quvchining ID sini oladi va yuqoridagi script URL ga so'rov yuboradi, qarzdorlikni qaytaradi.
- **Sahifa:** O'quvchi "To'lovlar" ga kirganda shu API dan qarzdorlik olinadi va **har 1 daqiqada** qayta so'raladi.
- **Sozlash:** Loyihada `.env` da `SHEET_DEBT_SCRIPT_URL=...` (sizning script URL ingiz) — bu qator qo'shildi.

### 3) Server (rash.uz)
- Kod serverda yangilangan bo'lishi kerak (git pull + build + restart).
- Serverdagi `.env` da ham **xuddi shu** `SHEET_DEBT_SCRIPT_URL` qatori bo'lishi kerak.

---

## Siz uchun bitta narsa

**Agar yangilanishlarni serverga yuklamagan bo'lsangiz:**

1. **Kompyuteringizda:** loyiha papkasida `git add -A`, `git commit -m "..."`, `git push` qiling.
2. **Serverda:** SSH bilan kiring, `/var/www/rash` ga o'ting. Agar `.env` da `SHEET_DEBT_SCRIPT_URL` yo'q bo'lsa — qo'shing. Keyin `./scripts/deploy-to-rash-uz.sh` ni ishga tushiring (yoki hujjatdagi "qo'lda" qadamlarni bajaring).

Shundan keyin rash.uz da o'quvchi kirsa, To'lovlar sahifasida qarzdorlik jadvaldan keladi va har daqiqa yangilanadi.

---

## Qisqacha sxema

```
Google Sheets (tolov 2.0)  →  Apps Script (URL)  →  IQMax API  →  To'lovlar sahifasi (qarzdorlik)
         ID + Holat              ?id=3736              sessiya              har daqiqa
```
