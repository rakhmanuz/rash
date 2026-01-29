# Ma'lumotlar Saqlanishi - Batafsil Qo'llanma

## 📍 Database Joylashuvi

**Hozirgi vaqtda barcha ma'lumotlar SQLite database'da saqlanadi:**

### Database Fayl:
- **Joylashuvi**: `prisma/dev.db`
- **Serverda**: `/var/www/rash/prisma/dev.db` (VPS)
- **Local'da**: `C:\IQMax\prisma\dev.db` (Windows)

## 📊 Qanday Ma'lumotlar Saqlanadi?

### 1. **O'quvchilar (Students)**
- **Jadval**: `User` + `Student`
- **Saqlanadigan ma'lumotlar**:
  - Ism, login, parol
  - Student ID (unique)
  - Telefon raqami
  - Rasm (agar yuklangan bo'lsa)
  - Infinity ballar
  - Daraja (level)
  - Umumiy ball (totalScore)
  - Davomat darajasi (attendanceRate)
  - O'zlashtirish darajasi (masteryLevel)
  - Yaratilgan vaqt (createdAt)
  - Yangilangan vaqt (updatedAt)

**Qayerda qo'shiladi:**
- Admin panel → O'quvchilar → "Yangi O'quvchi"
- Excel import orqali
- API: `/api/admin/students` (POST)

### 2. **Davomat (Attendance)**
- **Jadval**: `Attendance`
- **Saqlanadigan ma'lumotlar**:
  - O'quvchi ID (studentId)
  - Guruh ID (groupId)
  - Sana (date)
  - Kelgan/kelmagan (isPresent)
  - Kelgan vaqt (arrivalTime) - agar kelsa
  - Izohlar (notes)
  - Yaratilgan vaqt (createdAt)

**Qayerda qo'shiladi:**
- Teacher panel → Davomat Olish
- API: `/api/teacher/attendance` (POST)

### 3. **Ballar (Grades)**
- **Jadval**: `Grade`
- **Saqlanadigan ma'lumotlar**:
  - O'quvchi ID (studentId)
  - O'qituvchi ID (teacherId)
  - Guruh ID (groupId)
  - Ball (score)
  - Maksimal ball (maxScore)
  - Turi (type): test, homework, exam, haftalik_yozmaish
  - Izohlar (notes)
  - Yaratilgan vaqt (createdAt)
  - Yangilangan vaqt (updatedAt)

**Qayerda qo'shiladi:**
- Teacher panel → Baholash
- API: `/api/teacher/grading` (POST)

### 4. **Test Natijalari (Test Results)**
- **Jadval**: `TestResult`
- **Saqlanadigan ma'lumotlar**:
  - Test ID (testId)
  - O'quvchi ID (studentId)
  - To'g'ri javoblar soni (correctAnswers)
  - Izohlar (notes)
  - Yaratilgan vaqt (createdAt)

**Qayerda qo'shiladi:**
- Teacher panel → Baholash → Test natijalari
- API: `/api/teacher/grading` (POST)

### 5. **Guruhga Qo'shish (Enrollment)**
- **Jadval**: `Enrollment`
- **Saqlanadigan ma'lumotlar**:
  - O'quvchi ID (studentId)
  - Guruh ID (groupId)
  - Qo'shilgan sana (enrolledAt)
  - Faol/faol emas (isActive)

**Qayerda qo'shiladi:**
- Admin panel → Guruhlar → Guruh tanlash → O'quvchi qo'shish
- API: `/api/admin/groups/[id]/enroll` (POST)

## 🔒 Ma'lumotlar Xavfsizligi

### Saqlanishi:
1. ✅ **Doimiy saqlanadi** - Database fayli diskda saqlanadi
2. ✅ **Server qayta ishga tushganda ham saqlanadi** - Ma'lumotlar yo'qolmaydi
3. ✅ **Backup qilish mumkin** - `scripts/backup-database.sh` orqali

### Xavfsizlik:
- ✅ **Parollar hash qilinadi** - To'g'ridan-to'g'ri saqlanmaydi
- ✅ **Role-based access** - Har bir foydalanuvchi o'z ma'lumotlariga kirishi mumkin
- ✅ **Cascade delete** - O'quvchi o'chirilsa, barcha bog'liq ma'lumotlar ham o'chadi

## 📂 Database Strukturasi

```
prisma/dev.db (SQLite Database)
├── User (Foydalanuvchilar)
│   ├── id, username, name, password, role
│   └── infinityPoints
├── Student (O'quvchi profillari)
│   ├── id, userId, studentId
│   ├── level, totalScore, attendanceRate, masteryLevel
│   └── Relations: enrollments, attendances, grades, testResults
├── Attendance (Davomat)
│   ├── id, studentId, groupId, date
│   ├── isPresent, arrivalTime, notes
│   └── createdAt
├── Grade (Ballar)
│   ├── id, studentId, teacherId, groupId
│   ├── score, maxScore, type, notes
│   └── createdAt, updatedAt
├── TestResult (Test natijalari)
│   ├── id, testId, studentId
│   ├── correctAnswers, notes
│   └── createdAt, updatedAt
└── Enrollment (Guruhga qo'shish)
    ├── id, studentId, groupId
    ├── enrolledAt, isActive
    └── @@unique([studentId, groupId])
```

## 🔍 Ma'lumotlarni Ko'rish

### Database'ni To'g'ridan-to'g'ri Ko'rish:

**SQLite Browser yordamida:**
1. SQLite Browser dasturini o'rnating
2. `prisma/dev.db` faylini oching
3. Barcha jadvallarni ko'rishingiz mumkin

**Terminal orqali:**
```bash
# SQLite'ni o'rnating
sudo apt-get install sqlite3  # Linux
# yoki
brew install sqlite3  # Mac

# Database'ni ochish
sqlite3 prisma/dev.db

# Jadvallarni ko'rish
.tables

# O'quvchilarni ko'rish
SELECT * FROM User WHERE role = 'STUDENT';

# Davomatni ko'rish
SELECT * FROM Attendance ORDER BY date DESC LIMIT 10;

# Ballarni ko'rish
SELECT * FROM Grade ORDER BY createdAt DESC LIMIT 10;
```

## 📊 Ma'lumotlar Statistikasi

### Qanday Ko'rish Mumkin:

1. **Admin Dashboard** - Umumiy statistika
2. **Admin → O'quvchilar** - Barcha o'quvchilar ro'yxati
3. **Admin → Guruhlar** - Guruhlar va o'quvchilar
4. **Admin → Hisobotlar** - Batafsil hisobotlar
5. **Student Dashboard** - O'quvchi o'z ma'lumotlarini ko'radi
6. **Teacher Dashboard** - O'qituvchi o'z guruhlarini ko'radi

## ⚠️ Muhim Eslatmalar

1. **Backup qiling** - Muntazam ravishda backup qiling
2. **Database faylini himoya qiling** - `prisma/dev.db` faylini o'chirmang
3. **Server restart** - Server qayta ishga tushganda ma'lumotlar saqlanib qoladi
4. **Production** - Keyinchalik PostgreSQL yoki MySQL ishlatish tavsiya etiladi

## 🚀 Keyinchalik (Production)

Production uchun:
- PostgreSQL yoki MySQL database
- Remote database server
- Automatic backups
- Database replication
