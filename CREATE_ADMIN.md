# Admin Foydalanuvchi Yaratish

## Serverda Admin Yaratish:

### 1. Serverga SSH orqali kirish:
```bash
ssh root@rash.uz
```

### 2. Project folder'ga o'tish:
```bash
cd /var/www/rash
```

### 3. Admin yaratish (standart):
```bash
node scripts/create-admin.js
```

Bu buyruq quyidagi ma'lumotlar bilan admin yaratadi:
- **Login:** `admin`
- **Parol:** `admin123`
- **Ism:** `Admin`

### 4. O'z login va parolingiz bilan admin yaratish:
```bash
node scripts/create-admin.js <login> <parol> <ism>
```

**Misol:**
```bash
node scripts/create-admin.js rashadmin Rash123! Rash Admin
```

Bu buyruq quyidagi ma'lumotlar bilan admin yaratadi:
- **Login:** `rashadmin`
- **Parol:** `Rash123!`
- **Ism:** `Rash Admin`

## Admin Parolni Yangilash:

Agar admin allaqachon mavjud bo'lsa va parolni o'zgartirmoqchi bo'lsangiz:

```bash
node scripts/update-admin-password.js <login> <yangi-parol>
```

**Misol:**
```bash
node scripts/update-admin-password.js admin YangiParol123!
```

## Tekshirish:

1. **Admin mavjudligini tekshirish:**
   ```bash
   sqlite3 dev.db "SELECT username, name, role FROM User WHERE role='ADMIN';"
   ```

2. **Login qilish:**
   - Browser'dan `https://rash.uz/login` ni oching
   - Yaratilgan login va parol bilan kirish qiling

## Muhim Eslatmalar:

- ✅ Parolni xavfsiz joyda saqlang
- ✅ Parolni muntazam yangilang
- ✅ Login va parolni hech kimga bermang
- ✅ Agar parol unutilsa, `update-admin-password.js` script'ini ishlating

## Xavfsizlik:

- Parol kamida 8 belgidan iborat bo'lishi tavsiya etiladi
- Parol katta va kichik harflar, raqamlar va maxsus belgilar bilan aralash bo'lishi kerak
- Masalan: `Rash2024!Admin`
