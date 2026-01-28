# RASH - Tezkor O'rnatish Qo'llanmasi

## ✅ Server Ishga Tushdi!

Sizning serveringiz muvaffaqiyatli ishga tushgan! 🎉

## 🔐 Birinchi Admin Foydalanuvchisini Yaratish

401 xatosi shuni anglatadiki, hali hech qanday foydalanuvchi yaratilmagan. Quyidagi usullardan birini tanlang:

### Usul 1: Skript orqali (Tavsiya etiladi)

```powershell
# Default parol: admin123
npm run create-admin

# Yoki o'zingiz parol belgilash:
node scripts/create-admin.js your-password-here
```

**Default ma'lumotlar:**
- Email: `admin@rash.uz`
- Parol: `admin123`
- Role: `ADMIN`

### Usul 2: Prisma Studio orqali

```powershell
npx prisma studio
```

Prisma Studio'da:
1. `User` jadvalini oching
2. "Add record" tugmasini bosing
3. Quyidagi ma'lumotlarni kiriting:
   - `email`: admin@rash.uz
   - `name`: Admin
   - `password`: bcrypt hash (quyidagi kod bilan yarating)
   - `role`: ADMIN
   - `isActive`: true

**Parolni hash qilish:**
```javascript
// Node.js REPL'da (node yozib Enter bosing)
const bcrypt = require('bcryptjs');
bcrypt.hash('your-password', 10).then(console.log);
```

### Usul 3: SQL orqali (Ixtiyoriy)

```powershell
npx prisma db execute --stdin
```

Keyin SQL:
```sql
INSERT INTO User (id, email, name, password, role, isActive, createdAt, updatedAt)
VALUES (
  'clx1234567890',
  'admin@rash.uz',
  'Admin',
  '$2a$10$...', -- bcrypt hash
  'ADMIN',
  1,
  datetime('now'),
  datetime('now')
);
```

## 🚀 Keyingi Qadamlar

1. **Admin foydalanuvchisini yarating** (yuqoridagi usullardan biri)
2. **Login qiling:**
   - Email: `admin@rash.uz`
   - Parol: `admin123` (yoki o'zingiz belgilaganingiz)
3. **Admin paneliga kirish:**
   - Avtomatik `/admin/dashboard` sahifasiga yo'naltiriladi

## 📝 Qo'shimcha Foydalanuvchilar

Boshqa foydalanuvchilarni yaratish uchun:

1. **Admin panelidan** (keyinroq qo'shiladi)
2. **Prisma Studio** orqali
3. **Skriptni o'zgartirib** boshqa rollar uchun

## ⚠️ Xavfsizlik

- **Parolni darhol o'zgartiring!**
- Production'da kuchli `NEXTAUTH_SECRET` ishlating
- `.env` faylini Git'ga commit qilmang

## 🆘 Muammolar

Agar login qila olmasangiz:
1. Parol to'g'ri ekanligini tekshiring
2. Foydalanuvchi `isActive: true` ekanligini tekshiring
3. Database'da foydalanuvchi mavjudligini tekshiring:
   ```powershell
   npx prisma studio
   ```

---

**Muvaffaqiyatlar!** 🎉
