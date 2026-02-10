# Telegram Bot Sozlash Qo'llanmasi

## 🔧 Bot Kanalga Admin Qo'shish

### 1. Bot Token va Chat ID Tekshirish

**Bot Token:** `8373277453:AAHug96FwXclNsa0QNj5XabTWw_7LUfCl98`
**Kanal ID:** `-1003712822832` (Kanal ID -100 bilan boshlanadi)
**Kanal Link:** `https://t.me/+4Jy0TJrmelNhMzcy`

### 2. Bot'ni Kanalga Admin Qo'shish

#### Qadam 1: Kanalga Kiring
1. Telegram'da kanalga kiring: `https://t.me/+4Jy0TJrmelNhMzcy`
2. Yoki kanal nomini qidiring: `rash.uz click`

#### Qadam 2: Kanal Sozlamalarini Ochish
1. Kanal nomiga bosing
2. "Edit" yoki "Sozlamalar" tugmasini bosing
3. "Administrators" yoki "Administratorlar" ni tanlang

#### Qadam 3: Bot'ni Admin Qo'shish
1. "Add Administrator" yoki "Admin qo'shish" tugmasini bosing
2. Bot username'ini kiriting (BotFather'dan olingan)
3. **MUHIM:** "Post messages" yoki "Xabarlar yuborish" huquqini yoqing ✅
4. Boshqa huquqlar ixtiyoriy (kerak bo'lsa)
5. "Save" yoki "Saqlash" tugmasini bosing

### 3. Bot Sozlamalarini Tekshirish

#### BotFather'da:
1. Telegram'da `@BotFather` ga kiring
2. `/mybots` buyrug'ini yuboring
3. Bot'ni tanlang
4. "Bot Settings" > "Groups and Channels" ga kiring
5. Quyidagilarni tekshiring:
   - ✅ "Allow Groups" - Yoqilgan bo'lishi kerak
   - ✅ "Channel Admin Rights" - Yoqilgan bo'lishi kerak
   - ✅ "Post messages" huquqi - Tanlangan bo'lishi kerak

### 4. Chat ID ni To'g'ri Olish

Agar chat ID noto'g'ri bo'lsa:

#### Usul 1: Bot orqali
1. `@userinfobot` ga kanal linkini yuboring
2. Yoki `@getidsbot` ga kanal linkini yuboring
3. Bot sizga to'g'ri Chat ID ni beradi

#### Usul 2: Telegram API orqali
```bash
curl "https://api.telegram.org/bot8373277453:AAHug96FwXclNsa0QNj5XabTWw_7LUfCl98/getUpdates"
```

### 5. Test Qilish

#### Test Endpoint:
```
https://rash.uz/api/test-telegram
```

Yoki local'da:
```
http://localhost:3000/api/test-telegram
```

Agar xatolik bo'lsa, javobda quyidagilar ko'rsatiladi:
- `error_code: 400` - Chat ID noto'g'ri
- `error_code: 403` - Bot admin emas yoki huquq yo'q
- `error_code: 401` - Bot token noto'g'ri

### 6. Muammolarni Hal Qilish

#### Xatolik: "Chat not found"
- Kanal ID noto'g'ri
- Bot kanalga qo'shilmagan
- **Yechim:** Bot'ni kanalga qo'shing va to'g'ri Chat ID ni oling

#### Xatolik: "Bot is not a member of the channel"
- Bot kanalga qo'shilmagan
- **Yechim:** Bot'ni kanalga qo'shing

#### Xatolik: "Not enough rights to send text messages"
- Bot admin emas
- Bot'ga "Post messages" huquqi berilmagan
- **Yechim:** Bot'ni admin qiling va "Post messages" huquqini bering

#### Xatolik: "Unauthorized"
- Bot token noto'g'ri
- **Yechim:** BotFather'dan yangi token oling

### 7. To'g'ri Sozlash Checklist

- [ ] Bot kanalga qo'shilgan
- [ ] Bot kanalga admin sifatida qo'shilgan
- [ ] Bot'ga "Post messages" huquqi berilgan
- [ ] Bot token to'g'ri
- [ ] Chat ID to'g'ri
- [ ] Test endpoint muvaffaqiyatli ishlayapti

### 8. Server Loglarini Tekshirish

```bash
pm2 logs rash --lines 50
```

`[Telegram]` yoki `[Test]` bilan boshlanuvchi xabarlarni qidiring.

## 📝 Qo'shimcha Ma'lumot

- Bot token: `lib/telegram.ts` faylida
- Chat ID: `lib/telegram.ts` faylida
- Test endpoint: `app/api/test-telegram/route.ts`
- Startup notification: `scripts/send-startup-notification.js`
