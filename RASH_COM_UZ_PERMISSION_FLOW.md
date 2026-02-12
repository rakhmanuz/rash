# rash.com.uz - Assistant Admin ruxsatlar tartibi

## Asosiy qoida
- Assistant admin faqat `rash.com.uz` orqali ishlaydi.
- `rash.uz/rash` yo'li bloklangan.
- Har bir amal API darajasida ruxsat bilan tekshiriladi.

## Payments bo'limi
- `payments.view = true`
  - O'quvchini `studentId` bo'yicha qidirish mumkin.
  - `rash.com.uz` loginidan keyin `rash/payments` sahifasiga kirish mumkin.
- `payments.create = true`
  - To'lov kiritish (DB + Google Sheets yozish) mumkin.
- `payments.view = false`
  - O'quvchini qidirish ham, sahifada ish boshlash ham cheklanadi.
- `payments.create = false`
  - Qidirish mumkin, lekin to'lov saqlash bloklanadi.

## Ruxsatni kim boshqaradi
- Faqat `SUPER_ADMIN` (`/hq/admins`) yordamchi admin ruxsatlarini o'zgartiradi.
- Ruxsatlar `AssistantAdmin.permissions` JSON ichida saqlanadi.

## Tavsiya etilgan minimal ruxsat (cashier)
- `payments.view = true`
- `payments.create = true`
- qolgan bo'limlar `false`
