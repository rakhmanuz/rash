# Server Setup - Environment Variables

## Muhim: Serverda quyidagi environment variables'lar sozlangan bo'lishi KERAK:

```bash
# .env.local yoki .env faylida:

# NextAuth uchun
NEXTAUTH_URL=https://rash.uz
NEXTAUTH_SECRET=<random-secret-key-32-chars-or-more>

# Database
DATABASE_URL="file:./dev.db"

# Node environment
NODE_ENV=production
```

## Serverda tekshirish:

```bash
cd /var/www/rash
cat .env.local | grep NEXTAUTH
```

## Agar NEXTAUTH_URL va NEXTAUTH_SECRET yo'q bo'lsa:

1. **NEXTAUTH_SECRET yaratish:**
```bash
openssl rand -base64 32
```

2. **.env.local faylini yaratish/yangilash:**
```bash
nano .env.local
```

3. **Quyidagilarni qo'shish:**
```
NEXTAUTH_URL=https://rash.uz
NEXTAUTH_SECRET=<yangi-yaratilgan-secret>
NODE_ENV=production
DATABASE_URL="file:./dev.db"
```

4. **PM2'ni qayta ishga tushirish:**
```bash
pm2 restart rash
```

## Muammo hal bo'lmasa:

1. **Browser'dan cookie'larni tozalash**
2. **Server loglarini tekshirish:**
```bash
pm2 logs rash
```

3. **Database'dan user role'ni tekshirish:**
```bash
sqlite3 dev.db "SELECT id, username, role FROM User WHERE username='<username>';"
```
