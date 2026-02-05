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
- ✅ **Google Sheets Integratsiyasi** - To'lovlar avtomatik Google Sheets'ga yoziladi

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

# Google Sheets (ixtiyoriy)
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS='{"type":"service_account",...}'
GOOGLE_SHEETS_SPREADSHEET_ID="your-spreadsheet-id"
GOOGLE_SHEETS_SHEET_NAME="To'lovlar"
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

5. **Google Sheets sozlash (ixtiyoriy):**
```bash
# Batafsil qo'llanma: GOOGLE_SHEETS_SETUP.md
# To'lovlar avtomatik Google Sheets'ga yoziladi
```

6. **Development serverni ishga tushirish:**
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
│   ├── telegram.ts            # Telegram Web App utilities
│   ├── google-sheets.ts      # Google Sheets integratsiyasi
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

## 📊 Google Sheets Integratsiyasi

To'lovlar bo'limi Google Sheets bilan integratsiya qilingan. **Google Sheets'da barcha hisob-kitoblar bo'ladi**, tizim faqat kerakli kataklarni o'qiydi.

### Funksiyalar

- ✅ **Public Link orqali o'qish** - Google Sheets'ni public qilib, link orqali o'qish
- ✅ **API Key orqali o'qish** - Google Sheets API key ishlatib o'qish
- ✅ **Service Account orqali o'qish** - Service account credentials ishlatib o'qish
- ✅ **Avtomatik sync** - Google Sheets'dan to'lov holatlarini database'ga sync qilish
- ✅ **O'quvchi ID va To'lov holati** - C ustuni (ID) va S ustuni (Holat) ni o'qish

### Sozlash

**Variant 1: Public Link (Eng Oddiy)**
```env
GOOGLE_SHEETS_PUBLIC_URL="https://docs.google.com/spreadsheets/d/.../edit"
GOOGLE_SHEETS_SHEET_NAME="matematika"
```

**Variant 2: API Key**
```env
GOOGLE_SHEETS_API_KEY="AIzaSy..."
GOOGLE_SHEETS_SPREADSHEET_ID="..."
GOOGLE_SHEETS_SHEET_NAME="matematika"
```

**Variant 3: Service Account**
```env
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS='{"type":"service_account",...}'
GOOGLE_SHEETS_SPREADSHEET_ID="..."
GOOGLE_SHEETS_SHEET_NAME="matematika"
```

Batafsil qo'llanma: 
- `GOOGLE_SHEETS_PUBLIC_SETUP.md` - Public link sozlash
- `GOOGLE_SHEETS_SETUP.md` - Service account sozlash

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
- **Google Sheets:** Google APIs (googleapis)
- **Icons:** Lucide React

## 📄 Litsenziya

Bu loyiha MIT litsenziyasi ostida.

---

**RASH** — Professional o'quv markazi boshqaruv platformasi
