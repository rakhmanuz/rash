# Telegram O'quvchilar Bot Sozlash Qo'llanmasi

## 🤖 Bot Token
**Bot Token:** `8369765741:AAH7vS3X1z-Ul391bwNYP-c5G6zgHL2j5gc`

## 📋 Bot Qanday Ishlaydi

1. **/start** - Bot'ga `/start` yuborilganda telefon raqam so'raydi
2. **Telefon raqam** - Foydalanuvchi telefon raqamini yuboradi
3. **Tizimda topish** - Telefon raqam orqali o'quvchini topadi
4. **Ma'lumotlar** - O'quvchi ma'lumotlarini ko'rsatadi (statistika, testlar, davomat, va h.k.)
5. **Tugmalar** - Tugmalar orqali turli ma'lumotlarni ko'rish mumkin

## 🔧 Webhook Sozlash

### 1. BotFather'da Webhook Sozlash

Telegram'da `@BotFather` ga kiring va quyidagi buyruqlarni bajaring:

```
/setwebhook
```

Keyin webhook URL'ni yuboring:
```
https://rash.uz/api/telegram/student-bot
```

Yoki curl orqali:
```bash
curl -X POST "https://api.telegram.org/bot8369765741:AAH7vS3X1z-Ul391bwNYP-c5G6zgHL2j5gc/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://rash.uz/api/telegram/student-bot"}'
```

### 2. Webhook Tekshirish

```bash
curl "https://api.telegram.org/bot8369765741:AAH7vS3X1z-Ul391bwNYP-c5G6zgHL2j5gc/getWebhookInfo"
```

### 3. Webhook O'chirish (agar kerak bo'lsa)

```bash
curl -X POST "https://api.telegram.org/bot8369765741:AAH7vS3X1z-Ul391bwNYP-c5G6zgHL2j5gc/deleteWebhook"
```

## 📱 Bot Funksiyalari

### Asosiy Funksiyalar:
- ✅ Telefon raqam orqali foydalanuvchini topish
- ✅ O'quvchi ma'lumotlarini ko'rsatish
- ✅ Statistika (daraja, o'zlashtirish, ball, davomat)
- ✅ Testlar ro'yxati
- ✅ Davomat tarixi
- ✅ Yozma ishlar
- ✅ Vazifalar
- ✅ To'lovlar va qarzlar

### Tugmalar:
- 📊 **Statistika** - Asosiy ko'rsatkichlar
- 📝 **Testlar** - Test natijalari
- 📅 **Davomat** - Davomat tarixi
- ✍️ **Yozma ishlar** - Yozma ish natijalari
- 📋 **Vazifalar** - Vazifalar ro'yxati
- 💰 **To'lovlar** - To'lovlar va qarzlar
- 🔄 **Yangilash** - Ma'lumotlarni yangilash
- 🏠 **Bosh sahifa** - Asosiy sahifaga qaytish

## 🔐 Xavfsizlik

- Bot faqat o'quvchilar uchun (role: STUDENT)
- Telefon raqam orqali autentifikatsiya
- Session saqlash (1 soat)
- Faqat faol foydalanuvchilar (isActive: true)

## 🧪 Test Qilish

1. Telegram'da bot'ni toping (BotFather'dan username oling)
2. `/start` buyrug'ini yuboring
3. Telefon raqamingizni yuboring
4. Ma'lumotlaringiz ko'rinishi kerak

## 📝 Eslatmalar

- Bot webhook orqali ishlaydi
- Session memory-based (production'da Redis yoki DB ishlatish tavsiya etiladi)
- Telefon raqam formatlari: +998901234567, 998901234567, 901234567
- Har bir o'quvchi telefon raqami bilan tizimda bo'lishi kerak
