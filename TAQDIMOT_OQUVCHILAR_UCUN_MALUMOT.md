# O'quvchilar paneli — taqdimot uchun ma'lumot (slayt tayyorlash)

Bu hujjat **IQMax/RASH** platformasidagi **o'quvchilar sahifalari** haqida. Slayt tayyorlovchi ushbu ma'lumot asosida o'quvchilar uchun taqdimot slaytlarini yaratishi mumkin.

---

## 1. Platforma haqida (kirish slayti)

- **Loyiha nomi:** RASH / IQMax — ta'lim avtomatlashtirish platformasi.
- **Maqsad:** O'quv markazidagi jarayonlarni boshqarish: o'quvchilar nazorati, baholash, to'lovlar, xabarlar.
- **O'quvchi roli:** O'quvchi tizimga kirdi va faqat **o'quvchi paneli** (O'quvchi Paneli) orqali ishlaydi.

---

## 2. O'quvchi paneli — asosiy menyu (navigation)

O'quvchi kirishdan keyin quyidagi **4 ta asosiy bo'lim**ni ko'radi:

| № | Bo'lim      | Havola              | Qisqacha vazifasi                    |
|---|-------------|---------------------|--------------------------------------|
| 1 | Dashboard   | /student/dashboard  | Bosh sahifa — statistikalar, grafiklar |
| 2 | Davomat     | /student/attendance  | Darslarda qatnashish tarixi          |
| 3 | To'lovlar   | /student/payments    | To'lovlar va qarzdorlik              |
| 4 | Market      | /student/market     | Kitoblar va materiallar (Infinity ballar bilan) |

---

## 3. Dashboard (bosh sahifa)

**Maqsad:** O'quvchining barcha asosiy ko'rsatkichlari va progressi bir joyda.

### 3.1 Xush kelibsiz va xabarlar

- Sahifa tepasida **o'quvchi ismi** (Xush kelibsiz, …).
- **Xabarlar** bloki: yangi xabarlar soni, o'qilmaganlar alohida ko'rsatiladi; xabarni bosish orqali "o'qilgan" qilish.

### 3.2 Asosiy 4 ta kartochka (ko'rsatkichlar)

Har biri **foiz (%)** va **progress bar** bilan:

| Kartochka              | Qisqacha ma'nosi                    | Rang mantiqi (misol)      |
|------------------------|-------------------------------------|----------------------------|
| **Davomat darajasi**   | Darslarda qatnashish foizi          | 99%+ yaxshi, 75%+ o'rta, pastida qizil |
| **Uydagi topshiriq**   | Uy vazifalarini bajarish foizi     | 75%+ yaxshi, 40%+ sariq, pastida qizil |
| **O'zlashtirish darajasi** | Testlar bo'yicha o'zlashtirish   | 81%+ yaxshi, 50%+ sariq, pastida qizil |
| **O'quvchi qobilyati** | Yozma ishlar bo'yicha ko'rsatkich  | 70%+ yaxshi, 30%+ sariq, pastida qizil |

- Har bir kartochkada **oxirgi baholash sanasi** (qaysi dars/oy) ko'rsatilishi mumkin.

### 3.3 Grafiklar (chartlar)

- **Kunlik:** Bugungi kun uchun 4 ta ko'rsatkich (Davomat, Topshiriq, O'zlashtirish, Qobilyat) — ustunli diagramma.
- **Oylik:** Oxirgi 30 kun uchun chiziqli grafik (4 ta chiziq — davomat, topshiriq, ozlashtirish, qobilyat).
- **Yillik:** Kelgan kundan boshlab har dars uchun o'rtacha ko'rsatkich — maydon (area) grafigi.

### 3.4 Boshqa elementlar (ixtiyoriy slaytda)

- **Reyting / Infinity ballar:** O'quvchining reytingi va Infinity ballari (marketda ishlatiladi).
- **Bajarilgan / kutilmoqdagi topshiriqlar:** Pie chart yoki raqamlar.
- **Daraja (level) va baho:** Masalan A, B+, B, C, D — progress bar bilan keyingi darajaga.
- **Kurs fikrlari:** Tizim o'quvchi statistikasiga qarab qisqa "fikr" (maslahat) beradi.
- **Real-vaqt:** Ma'lumotlar bir necha soniyada yangilanadi (taqdimotda "real-vaqt yangilanish" deb ta'kidlash mumkin).

---

## 4. Davomat sahifasi

**Maqsad:** Barcha darslar va qatnashish holati bir joyda.

- **Sarlavha:** "Davomat" — "Barcha darslar va kelmagan darslar ro'yxati".
- **Kelmagan darslar:** Alohida blok (qizil mavzu); har birida: sana, hafta kuni, guruh nomi.
- **Barcha darslar:** Ro'yxat — har bir dars uchun:
  - Sana, guruh nomi
  - Kelgan / Kelmadi (yashil / qizil belgi)
  - Kelgan vaqt (agar bor bo'lsa)
  - Qisqa izoh (agar bor bo'lsa)

---

## 5. To'lovlar sahifasi

**Maqsad:** O'quvchi o'z to'lovlari va qarzdorligini ko'radi.

- Menyuda **"To'lovlar"** orqali ochiladi.
- To'lovlar ro'yxati, muddatlar, to'langan / to'lanmagan holat.
- Qarzdorlik (debt) — Dashboardda ham ko'rsatiladi.

*(Texnik tafsilot: sahifa navida mavjud; batafsil UI loyihada qo'shilishi mumkin.)*

---

## 6. Market sahifasi

**Maqsad:** O'quvchi markaz kitoblari va materiallarini **Infinity ballar** bilan "sotib" olishi.

- **Sarlavha:** "Market — O'quv markazi kitoblari va materiallari".
- **Mahsulotlar:** Kartochkalar — nomi, tavsifi, kategoriya, **Infinity narxi** (∞ + ball), qoldiq (stock).
- **Qidiruv:** Mahsulotlar bo'yicha qidirish.
- **Savatcha:** Mahsulotlarni savatchaga qo'shish, miqdorni o'zgartirish, o'chirish.
- **Buyurtma:** Yetkazib berish manzili, telefon, izoh kiritib buyurtma berish; to'lov Infinity ballar hisobidan amalga oshadi.
- **Ballar:** O'quvchining Infinity balllari sahifada ko'rsatiladi (Dashboardda ham mavjud).

---

## 7. Texnik va dizayn xususiyatlari (ixtiyoriy slayt)

- **Rollar:** Faqat o'quvchi roli uchun ochiq; o'qituvchi/admin panellari boshqa.
- **Mobil:** Barcha sahifalar mobil qurilmalarda qulay ishlaydi (responsive).
- **Xavfsizlik:** Kirish faqat admin tomonidan berilgan login/parol orqali.
- **Vaqt:** Dashboard ma'lumotlari real-vaqtda (bir necha soniyada) yangilanadi.

---

## 8. Slaytlar uchun taklif struktura

1. **Kirish:** Platforma nomi, o'quvchi paneli haqida 1–2 jumla.
2. **O'quvchi paneli menyu:** 4 ta bo'lim (Dashboard, Davomat, To'lovlar, Market) — skrinshot yoki sxema.
3. **Dashboard:** 4 ta kartochka + grafiklar (kunlik, oylik, yillik) — skrinshot yoki mockup.
4. **Davomat:** Kelmagan darslar + barcha darslar ro'yxati.
5. **To'lovlar:** To'lovlar va qarzdorlik ko'rinishi.
6. **Market:** Mahsulotlar, savatcha, Infinity ballar.
7. **Xulosa:** Qisqacha foyda — barcha ma'lumot bir joyda, real-vaqt, mobil, xavfsiz.

---

## 9. Kalit so'zlar (glossary)

- **Dashboard** — bosh sahifa, statistikalar.
- **Davomat** — darslarda qatnashish.
- **Infinity (∞)** — platforma ichidagi balllar; marketda "pul" o'rnida.
- **O'zlashtirish** — test natijalari bo'yicha daraja.
- **O'quvchi qobilyati** — yozma ishlar bo'yicha ko'rsatkich.
- **Real-vaqt** — ma'lumotlarning tez yangilanishi.

---

*Ushbu ma'lumot IQMax/RASH loyiha kodiga asoslangan. Slayt dizayni va matnlar taqdimot tayyorlovchi tomonidan qisqartirilishi yoki kengaytirilishi mumkin.*
