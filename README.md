# RASH — Education Automation Platform

Professional o'quv markazlari uchun to'liq avtomatlashtirilgan raqamli boshqaruv platformasi.

## 🎯 Platforma Haqida

RASH — bu zamonaviy o'quv markazlari uchun mo'ljallangan to'liq avtomatlashtirilgan raqamli boshqaruv platformasi. Platforma o'quv markazidagi barcha jarayonlarni — o'quvchilar nazorati, baholash, to'lovlar, o'qituvchilar faoliyati va menejment hisobotlarini — bitta kuchli va aqlli tizimda birlashtiradi.

### Asosiy Xususiyatlar

- ✅ **Role-Based Access Control (RBAC)** - O'quvchi, O'qituvchi, Admin panellari
- ✅ **Premium Landing Page** - 3D animatsiyalar va futuristik dizayn
- ✅ **To'liq Avtomatlashtirish** - Barcha jarayonlar avtomatik
- ✅ **Real-time Statistikalar** - Davomat, baholar, to'lovlar
- ✅ **Xavfsizlik** - Faqat admin tomonidan berilgan kirish
- ✅ **Mobile Responsive** - Barcha qurilmalarda mukammal ishlaydi

## 🚀 Tezkor Boshlash

### Talablar

- Node.js 18+
- npm yoki yarn
- Git

### O'rnatish

1. **Dependencies o'rnatish:**
```bash
npm install
```

2. **Environment variables sozlash:**
```bash
cp .env.example .env
```

`.env` faylini ochib, quyidagilarni to'ldiring:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

**Muhim:** `NEXTAUTH_SECRET` uchun kuchli random string ishlating:
```bash
openssl rand -base64 32
```

3. **Ma'lumotlar bazasini yaratish:**
```bash
npx prisma generate
npx prisma db push
```

4. **Birinchi admin foydalanuvchisini yaratish:**
```bash
npx prisma studio
```

Prisma Studio'da `User` jadvaliga yangi foydalanuvchi qo'shing:
- `email`: admin@rash.uz
- `name`: Admin
- `password`: bcrypt hash (parolni hash qilish uchun quyidagi kodni ishlating)
- `role`: ADMIN

Parolni hash qilish uchun:
```javascript
// Node.js REPL yoki script
const bcrypt = require('bcryptjs');
bcrypt.hash('your-password', 10).then(console.log);
```

5. **Development serverni ishga tushirish:**
```bash
npm run dev
```

Brauzerda oching: http://localhost:3000

## 📁 Loyiha Strukturasi

```
RASH/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication
│   │   ├── student/           # Student endpoints
│   │   ├── teacher/           # Teacher endpoints
│   │   └── admin/             # Admin endpoints
│   ├── student/               # Student dashboard pages
│   ├── teacher/               # Teacher dashboard pages
│   ├── admin/                 # Admin dashboard pages
│   ├── login/                 # Login page
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Landing page
├── components/
│   ├── landing/               # Landing page components
│   ├── DashboardLayout.tsx    # Dashboard layout wrapper
│   ├── Navbar.tsx             # Navigation bar
│   └── Footer.tsx             # Footer
├── lib/
│   ├── auth.ts                # NextAuth configuration
│   ├── prisma.ts              # Prisma client
│   └── utils.ts               # Utility functions
├── prisma/
│   └── schema.prisma          # Database schema
└── types/
    └── next-auth.d.ts         # TypeScript definitions
```

## 🎨 Role-Based Dashboards

### 👨‍🎓 O'quvchi Paneli
- Davomat statistikasi (grafiklar)
- O'zlashtirish darajasi
- Hozirgi bilim darajasi (level system)
- Topshiriqlar va test natijalari
- To'lovlar holati

### 👨‍🏫 O'qituvchi Paneli
- Biriktirilgan guruhlar ro'yxati
- Har bir o'quvchi bo'yicha ball kiritish
- O'zlashtirish monitoringi
- Oylik maosh avtomatik hisoblanadi
- Bonus tizimi (natijaga bog'langan)

### 👨‍💼 Admin / Menejer Paneli
- Barcha o'quvchilar ro'yxati
- Guruhlar boshqaruvi
- O'qituvchilar nazorati
- To'lovlar: kirim / chiqim / qarzdorlik
- Umumiy moliyaviy hisobot
- Statistik dashboard (charts, KPI)

## 🔐 Authentication

- **Ochiq ro'yxatdan o'tish YO'Q**
- Login va parollar faqat admin tomonidan beriladi
- Role-based access control (RBAC)
- Avtomatik role-based redirect

## 🗄️ Database Schema

- **User** - Foydalanuvchilar (role-based)
- **Student** - O'quvchi profillari
- **Teacher** - O'qituvchi profillari
- **Group** - Guruhlar
- **Enrollment** - O'quvchi-guruh bog'lanishi
- **Attendance** - Davomat
- **Assignment** - Topshiriqlar
- **Grade** - Baholar
- **Payment** - To'lovlar
- **Schedule** - Dars jadvali

## 🛠️ Foydali Buyruqlar

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Database
npx prisma generate      # Generate Prisma Client
npx prisma db push         # Schema'ni database'ga push qilish
npx prisma studio     # Database GUI

# Linting
npm run lint
```

## 📝 Keyingi Qadamlar

1. **Ma'lumotlar Bazasini O'zgartirish:**
   - `prisma/schema.prisma` faylini tahrirlang
   - `npx prisma db push` buyrug'ini ishga tushiring

2. **Yangi Funksiyalar Qo'shish:**
   - API routes: `app/api/` papkasida
   - Dashboard sahifalar: `app/student/`, `app/teacher/`, `app/admin/`
   - Komponentlar: `components/` papkasida

## 🎯 Texnik Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Prisma ORM + SQLite
- **Authentication:** NextAuth.js
- **Icons:** Lucide React

## 📄 Litsenziya

Bu loyiha MIT litsenziyasi ostida.

---

**RASH** — Professional o'quv markazi boshqaruv platformasi
