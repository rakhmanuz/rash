# Qarzdorlik ishlamasa — tekshirish

To'lovlar sahifasida endi **Qarzdorlik** qatori ostida qisqa xabar va **ID** ko‘rinadi. Shu orqali nima noto‘g‘ri ekanini aniqlashingiz mumkin.

---

## 1. Sahifada nima ko‘rsatiladi?

O‘quvchi hisobi bilan **To'lovlar** sahifasiga kiring. Qarzdorlik qatori ostidagi matn:

| Ko‘rinadigan matn | Sabab | Nima qilish |
|-------------------|--------|-------------|
| **Hisobdan (har daqiqa yangilanadi)** va **ID: 3736** | Script ishlayapti, jadvaldan ma’lumot keladi. | Agar summa 0 bo‘lsa — jadvalda shu ID (3736) va **Holat** ustunida qiymat bormi tekshiring. |
| **Sozlama yo'q (SHEET_DEBT_SCRIPT_URL)** | Serverda `SHEET_DEBT_SCRIPT_URL` o‘rnatilmagan yoki ilova yangilanmagan. | Serverda `.env` ga qator qo‘shing va `pm2 restart rash` bering. |
| **Xatolik** yoki **Script 404...** va boshqa xabar | Script URL noto‘g‘ri yoki Google script xato qaytarmoqda. | Quyidagi 2 va 3-bandlarni tekshiring. |
| **ID: ...** ko‘rinadi, lekin qarzdorlik 0 | ID to‘g‘ri yuborilmoqda, jadvalda shu ID da qarzdorlik yo‘q yoki ustun noto‘g‘ri. | Google Sheets da shu ID li qator va **Holat** (yoki qarzdorlik) ustunini tekshiring. |

---

## 2. Serverda .env tekshirish

SSH orqali serverga kiring:

```bash
cd /var/www/rash
grep SHEET_DEBT_SCRIPT_URL .env
```

Agar hech narsa chiqmasa — qator yo‘q. Qo‘shing:

```bash
nano .env
```

Oxiriga:

```
SHEET_DEBT_SCRIPT_URL=https://script.google.com/macros/s/AKfycbx40NjpDnccze-QmIFqgr43-jatBaUO_NFMeFJMe7Ty4WBTSTmIWq0QrYWpGRfAcofT/exec
```

Saqlang (Ctrl+O, Enter), chiqing (Ctrl+X). Keyin:

```bash
pm2 restart rash
```

---

## 3. Google Apps Script tekshirish

Brauzerda shu manzilni oching (o‘rniga o‘quvchi ID sini yozing, masalan 3736):

```
https://script.google.com/macros/s/AKfycbx40NjpDnccze-QmIFqgr43-jatBaUO_NFMeFJMe7Ty4WBTSTmIWq0QrYWpGRfAcofT/exec?id=3736
```

- **`{"debt":400000}`** yoki boshqa son ko‘rinsa — script ishlayapti. Muammo loyiha .env yoki restartda.
- **`{"debt":0}`** — script ishlayapti, lekin jadvalda shu ID da qator topilmadi yoki qarzdorlik ustuni boshqa.
- Xato sahifa yoki boshqa matn — script deploy qilinganmi va “Who has access: Anyone” qilib chiqilganmi tekshiring.

---

## 4. O‘quvchi ID (login) mosligi

Sahifada **ID: 3736** ko‘rsatilsa, tizim 3736 ni Google script ga yuboradi. Jadvalda ham **ID** ustunida aynan **3736** bo‘lgan qator bo‘lishi kerak. O‘quvchi **login**i (username) — tizimda shu **studentId** ga teng bo‘ladi. Agar login boshqa bo‘lsa (masalan 3737), jadvalda 3737 bo‘lgan qator qidiriladi.

---

## 5. Qisqacha

1. **To'lovlar** sahifasidagi qisqa xabar va **ID** ni ko‘ring.
2. **Sozlama yo'q** bo‘lsa — serverda `SHEET_DEBT_SCRIPT_URL` qo‘shing va `pm2 restart rash`.
3. **Xatolik** bo‘lsa — brauzerda `.../exec?id=3736` ni ochib script javobini tekshiring.
4. **ID** to‘g‘ri, lekin summa 0 — jadvalda shu ID va **Holat** (qarzdorlik) ustunini tekshiring.
