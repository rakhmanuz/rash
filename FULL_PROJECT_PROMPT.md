# RASH (rash.uz / rash.com.uz) — Professional To'liq Loyiha Prompti

Bu hujjat loyihani noldan qayta qurish yoki AI yordamida tahrirlash uchun to'liq, professional darajadagi prompt sifatida ishlatish uchun mo'ljallangan. Har bir mayda-chuyda tafsilot qamrab olingan.

---

## 1. LOYIHA UMUMIY MA'LUMOTI

**Loyiha nomi:** RASH — Raqamli o'quv ekotizimi  
**Versiya:** 1.0.0  
**Til:** TypeScript, JavaScript  
**Tavsif:** Professional o'quv markazlari uchun to'liq avtomatlashtirilgan raqamli boshqaruv platformasi. O'quvchilar, o'qituvchilar, adminlar va yordamchi adminlar uchun maxsus panellar.

**Domainlar va ularning vazifasi:**
- **rash.uz** / **www.rash.uz** — Asosiy platforma (Admin, Menejer, O'qituvchi, O'quvchi panellari)
- **rash.com.uz** / **www.rash.com.uz** — Yordamchi adminlar portali (faqat ASSISTANT_ADMIN roli)

---

## 2. TEXNOLOGIYALAR VA STACK

| Kategoriya | Texnologiya | Versiya/Rejim |
|------------|-------------|---------------|
| Framework | Next.js | 14.x |
| UI | React | 18.x |
| Til | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4.x |
| Auth | NextAuth.js | 4.24.x (Credentials provider, JWT strategy) |
| DB | SQLite + Prisma ORM | WAL rejimi |
| Parol hash | bcryptjs | 2.4.x |
| Grafiklar | recharts | 3.7.x |
| Sana | date-fns | 4.x |
| Validatsiya | zod | 3.22.x |
| Excel | xlsx | 0.18.x |
| Server | Node.js (http.createServer) | Custom server.js |
| Production | PM2 | 1 instance, 1G memory limit |
| Ikonlar | lucide-react | 0.303.x |

**SQLite WAL rejimi:** Prisma init vaqtida `prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL')` ishlatiladi.

---

## 3. FOYDALANUVCHI ROLLARI

| Rol | Domain | Kirish | Imkoniyatlar |
|-----|--------|--------|--------------|
| ADMIN | rash.uz | username + password | To'liq boshqaruv |
| MANAGER | rash.uz | username + password | Admin bilan bir xil |
| TEACHER | rash.uz | username + password | O'qituvchi paneli |
| STUDENT | rash.uz | username + password | O'quvchi paneli |
| ASSISTANT_ADMIN | rash.com.uz | username + password | Ruxsatga qarab cheklangan admin paneli |

**Login format:** Faqat username (email emas). Student va Teacher uchun ham username.

---

## 4. MIDDLEWARE VA DOMAIN LOIKASI

**Path:** `middleware.ts`, `withAuth` ishlatiladi.

**Host aniqlash:** `x-forwarded-host` yoki `host` header, toLowerCase() bilan.

**Asosiy qoidalar:**
1. rash.uz da `/assistant-admin` ga kirish → `https://rash.com.uz/login` ga redirect
2. rash.com.uz da `/admin` ga kirish → `https://rash.uz/admin/dashboard` ga redirect
3. rash.com.uz da ASSISTANT_ADMIN bo'lmasa → `/login` yoki rash.uz ga redirect
4. rash.uz da ASSISTANT_ADMIN bo'lsa → `https://rash.com.uz/assistant-admin/dashboard` ga redirect
5. `/dashboard` → roliga qarab mos dashboard ga yuboriladi (ADMIN/MANAGER→admin, ASSISTANT_ADMIN→assistant-admin, TEACHER→teacher, STUDENT→student)
6. Admin yo'llari faqat ADMIN va MANAGER uchun
7. Assistant-admin yo'llari faqat ASSISTANT_ADMIN uchun, va har bo'lim uchun `permissions` tekshiriladi (view/create/edit/delete)

**Assistant-admin bo'lim ruxsatlari (permissionKey):**
- `/assistant-admin/dashboard`, `/assistant-admin/profile` — ruxsat tekshiruvsiz
- `/assistant-admin/payments` — permissions.payments.view
- `/assistant-admin/students` — permissions.students.view
- `/assistant-admin/reports` — permissions.reports.view
- `/assistant-admin/schedules` — permissions.schedules.view
- `/assistant-admin/tests` — permissions.tests.view
- `/assistant-admin/groups` — permissions.groups.view
- `/assistant-admin/teachers` — permissions.teachers.view
- `/assistant-admin/market` — permissions.market.view

**Matcher:** `/login`, `/dashboard/*`, `/admin/*`, `/assistant-admin/*`, `/teacher/*`, `/student/*`

---

## 5. AUTH (NextAuth) KONFIGURATSIYASI

**Path:** `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`

**Provider:** CredentialsProvider.  
**Credentials:** `username`, `password`.

**Authorize logikasi:**
1. Username trim qilinadi
2. User `prisma.user.findUnique({ where: { username } })` bilan topiladi
3. `assistantAdminProfile` include qilinadi
4. User topilmasa → "Login yoki parol noto'g'ri"
5. Parol yo'q bo'lsa → "Login yoki parol noto'g'ri"
6. `isActive === false` bo'lsa → "Siz tizimdan uzulgansiz"
7. `bcrypt.compare(incomingPassword, user.password)` — noto'g'ri bo'lsa xato
8. Muvaffaqiyat: `{ id, username, name, image, role, permissions }` qaytariladi
9. ASSISTANT_ADMIN uchun `permissions` = `JSON.parse(assistantAdminProfile.permissions)` yoki null

**Session:** JWT strategy.

**JWT callback:** `token.id`, `token.role`, `token.username`, `token.name`, `token.permissions` (ASSISTANT_ADMIN uchun).

**Session callback:** `session.user.id`, `session.user.role`, `session.user.permissions`.

**Pages:** signIn: `/login`

---

## 6. DATABASE SCHEMA (Prisma)

**Fayl:** `prisma/schema.prisma`  
**Provider:** sqlite, `file:./dev.db`

**Modellar va maydonlar:**

### User
- id (cuid), username (unique), name, password, role (default "STUDENT"), phone?, image?, infinityPoints (default 0), isActive (default true), createdAt, updatedAt
- Relations: studentProfile, teacherProfile, assistantAdminProfile, sessions, accounts, sentMessages, receivedMessages, assignedTasks, receivedTasks, orders

### Student
- id (cuid), userId (unique), studentId (unique), level (default 1), totalScore (default 0), attendanceRate (default 0), masteryLevel (default 0), contacts (JSON string, default "[]")
- Relations: enrollments, attendances, assignments, payments, grades, testResults, writtenWorkResults

### Teacher
- id (cuid), userId (unique), teacherId (unique), baseSalary (default 0), bonusRate (default 0), totalEarnings (default 0)
- Relations: groups, grades

### AssistantAdmin
- id (cuid), userId (unique), permissions (JSON string, default "{}"), notes?
- Relations: user

### Group
- id (cuid), name, description?, teacherId, maxStudents (default 20), isActive (default true)
- Relations: enrollments, schedules, classSchedules, tests, writtenWorks, grades

### Enrollment
- id (cuid), studentId, groupId, enrolledAt (default now), isActive (default true)
- @@unique([studentId, groupId])

### Attendance
- id (cuid), studentId, groupId, classScheduleId?, date (default now), isPresent (default true), arrivalTime?, notes?
- @@index([studentId, classScheduleId]), @@index([groupId, date])

### Assignment
- id (cuid), studentId, groupId, title, description?, maxScore (default 100), score?, isCompleted (default false), dueDate?, submittedAt?, createdAt, updatedAt

### Test
- id (cuid), groupId, date, totalQuestions, type ("kunlik_test" | "uyga_vazifa"), title?, description?, classScheduleId?, createdAt, updatedAt
- @@index([groupId, date])

### TestResult
- id (cuid), testId, studentId, correctAnswers, notes?
- @@unique([testId, studentId]), @@index([studentId])

### WrittenWork
- id (cuid), groupId, date, totalQuestions, timeGiven (daqiqada), title?, description?, classScheduleId?
- @@index([groupId, date])

### WrittenWorkResult
- id (cuid), writtenWorkId, studentId, correctAnswers (default 0), remainingTime (default 0), score, masteryLevel, notes?
- @@unique([writtenWorkId, studentId]), @@index([studentId])

### Grade
- id (cuid), studentId, teacherId, groupId, score, maxScore (default 100), type, notes?, createdAt, updatedAt

### Payment
- id (cuid), studentId, amount, type (TUITION, MATERIALS, EXAM, OTHER), status (PENDING, PAID, OVERDUE, CANCELLED), dueDate?, paidAt?, notes?, createdAt, updatedAt

### Schedule
- id (cuid), groupId, dayOfWeek (0-6), startTime (HH:mm), endTime (HH:mm), room?

### ClassSchedule
- id (cuid), groupId, date, times (JSON string, array: ["05:30", "09:00"]), notes?
- @@index([groupId, date])

### Message
- id (cuid), senderId, recipientId?, recipientRole? (STUDENT, TEACHER, null = all), title, content, isRead (default false), readAt?, createdAt, updatedAt

### VisitorActivity
- id (cuid), userId?, sessionId (unique), page, userAgent?, ipAddress?, lastActivity (default now)
- @@index([lastActivity])

### Product
- id (cuid), name, description?, category (kitob, darslik, qo'llanma, boshqa), price (default 0), infinityPrice (default 0), image?, stock (default 0), isActive (default true)

### Order
- id (cuid), userId, totalAmount, status (pending, completed, cancelled), deliveryAddress?, phone?, notes?, items

### OrderItem
- id (cuid), orderId, productId, quantity, price

### CourseFeedbackTemplate
- id (cuid), metricType (attendance, assignment, mastery, ability), minValue, maxValue?, feedbackText
- @@index([metricType])

### AssistantAdminTask
- id (cuid), title, description?, status (PENDING, COMPLETED), dueDate?, completedAt?, completionSeen (default true), assignedById, assignedToId, createdAt, updatedAt
- @@index([assignedToId, status]), @@index([assignedById, createdAt])

### NextAuth: Account, Session, VerificationToken

---

## 7. BIZNES-LOGIKA (MUHIM)

### Student ID generatsiya
**Fayl:** `lib/student-id-generator.ts`  
- Boshlang'ich ID: 1070010  
- Eng katta mavjud raqamli ID + 1 qaytariladi  
- `assignStudentIdsToExisting()` — mavjud o'quvchilarga ID berish

### Davomat foizi hisoblash
**Manba:** `app/api/student/stats/route.ts`, `calculateAttendancePercentage`  
- `arrivalTime` va `classSchedule.times` bor bo'lsa: dars vaqti 3 soat, kelish vaqti va boshlanish vaqti orasidagi qolgan vaqt / 3 soat * 100%
- Kelish vaqti dars boshlanishidan oldin = 100%
- Kelish vaqti dars tugagandan keyin = 0%
- `arrivalTime` yo'q bo'lsa: bor=100%, yo'q=0%

### O'quvchi dashboard 4 ta asosiy kartochka (FAQAT oxirgi natija, aggregate EMAS)
1. **Davomat darajasi** — oxirgi dars (classSchedule yoki att.date bo'yicha). `lastResults.attendance.percentage`
2. **Uydagi topshiriq** — oxirgi uyga_vazifa natijasi, davomatga bog'liq emas. `lastResults.homework.percentage`
3. **O'zlashtirish darajasi** — oxirgi kunlik_test natijasi, davomatga bog'liq emas. `lastResults.test.percentage`
4. **O'quvchi qobilyati** — oxirgi yozma ish natijasi (masteryLevel). `lastResults.writtenWork.percentage`

### Grafiklar (Student dashboard)
- **Kunlik:** bugungi kun
- **Oylik:** oxirgi 30 kun
- **Yillik:** kelgan kundan (enrollmentDate) to shu kungacha  
Har birida: davomat, topshiriq, o'zlashtirish, qobilyat chiziqlari.

### Kurs fikrlari
`CourseFeedbackTemplate` dan metricType (attendance, assignment, mastery, ability) va minValue, maxValue bo'yicha mos fikr matni qaytariladi.

### Visitor tracking
**Fayl:** `components/VisitorTracker.tsx`  
- sessionStorage: `visitor_session_id` (session_${Date.now()}_${random})
- sendBeacon yoki fetch (keepalive: true) POST `/api/visitors/track`
- Throttle: 15 soniya
- Interval: 90 soniya
- Payload: { sessionId, page (pathname), userAgent }

### Infinity ballar
User.infinityPoints — o'quvchilar uchun. Marketda mahsulot sotib olish (infinityPrice).

### Vaqt zona
**Fayl:** `lib/utils.ts`  
O'zbekiston UTC+5. `formatDateShort` va `createUzbekistanDate` ishlatiladi.

---

## 8. LAYOUT VA ROUTING

**Umumiy layout:** `ConditionalLayout` — `/login` dan tashqarida Navbar + main + Footer  
**Login layout:** oddiy, Navbar/Footer yo'q  
**Dashboard:** `DashboardLayout` — sidebar + main, role bo'yicha

### rash.uz sahifalari

| Path | Rol | Tavsif |
|------|-----|--------|
| / | Hammaga | Landing (PremiumHero) yoki rash.com.uz bo'lsa maxsus |
| /login | Hammaga | Login forma |
| /admin/dashboard | ADMIN, MANAGER | KPI, statistikalar |
| /admin/students | ADMIN, MANAGER | CRUD, import, enrollment |
| /admin/teachers | ADMIN, MANAGER | O'qituvchilar CRUD |
| /admin/groups | ADMIN, MANAGER | Guruhlar CRUD |
| /admin/schedules | ADMIN, MANAGER | Dars rejalari, import |
| /admin/tests | ADMIN, MANAGER | Testlar, yozma ishlar |
| /admin/payments | ADMIN, MANAGER | To'lovlar |
| /admin/market | ADMIN, MANAGER | Mahsulotlar, buyurtmalar |
| /admin/infinity | ADMIN, MANAGER | Infinity ballar |
| /admin/course-feedback | ADMIN, MANAGER | Kurs fikrlari shablonlari |
| /admin/reports | ADMIN, MANAGER | Hisobotlar |
| /admin/assisteng | ADMIN, MANAGER | Yordamchi adminlar, ruxsatlar, topshiriqlar |
| /teacher/dashboard | TEACHER | O'qituvchi dashboard |
| /teacher/groups | TEACHER | Guruhlar ro'yxati |
| /teacher/groups/[id] | TEACHER | Guruh detali |
| /teacher/attendance | TEACHER | Davomat olish |
| /teacher/grading | TEACHER | Baholash (test, yozma ish) |
| /teacher/salary | TEACHER | Maosh |
| /teacher/market | TEACHER | Market |
| /student/dashboard | STUDENT | 4 kartochka, grafiklar, oxirgi 10 natija |
| /student/attendance | STUDENT | Davomat ko'rinishi |
| /student/payments | STUDENT | To'lovlar |
| /student/market | STUDENT | Market |

### rash.com.uz sahifalari (ASSISTANT_ADMIN)

| Path | Ruxsat | Tavsif |
|------|--------|--------|
| /assistant-admin/dashboard | — | Muhim topshiriqlar, tezkor havolalar |
| /assistant-admin/profile | — | Profil |
| /assistant-admin/payments | payments.view | To'lovlar |
| /assistant-admin/students | students.view/create/edit | O'quvchilar, oxirgi 5 ta |
| /assistant-admin/reports | reports.view | Hisobotlar |
| /assistant-admin/schedules | schedules.view | Dars rejalari |
| /assistant-admin/tests | tests.view | Testlar |
| /assistant-admin/groups | groups.view | Guruhlar, enrollment |
| /assistant-admin/teachers | teachers.view | O'qituvchilar |
| /assistant-admin/market | market.view | Market |

---

## 9. API ENDPOINTS (to'liq ro'yxat)

### Auth
- `POST /api/auth/[...nextauth]` — NextAuth handlers
- `GET /api/auth/user` — joriy user

### Student
- `GET /api/student/stats` — stats, lastResults, yearlyData, monthlyData, dailyData, recentResults
- `GET /api/student/attendance` — davomat tarixi
- `GET /api/student/grades` — baholar
- `GET /api/student/ranking` — reyting
- `GET /api/student/course-feedback` — query: attendanceRate, assignmentRate, mastery, ability

### Teacher
- `GET /api/teacher/groups`, `GET /api/teacher/groups/[id]`
- `GET /api/teacher/schedules`
- `POST /api/teacher/attendance`
- `GET/POST /api/teacher/tests`, `GET/POST /api/teacher/test-results`
- `GET/POST /api/teacher/written-works`, `GET/POST /api/teacher/written-work-results`
- `GET/POST /api/teacher/grades`
- `GET/POST /api/teacher/assignments`, `PUT /api/teacher/assignments/[id]`
- `GET /api/teacher/stats`
- `GET /api/teacher/salary`

### Admin
- `GET /api/admin/stats`
- `GET/POST /api/admin/students`, `GET/PUT/DELETE /api/admin/students/[id]`
- `POST /api/admin/students/import`
- `GET /api/admin/students/excel-template`
- `POST /api/admin/students/[id]/enrollment`
- `GET/POST /api/admin/teachers`, `GET/PUT/DELETE /api/admin/teachers/[id]`
- `GET/POST /api/admin/groups`, `GET/PUT/DELETE /api/admin/groups/[id]`, `POST /api/admin/groups/[id]/enroll`
- `GET/POST /api/admin/schedules`, `GET/PUT/DELETE /api/admin/schedules/[id]`
- `POST /api/admin/schedules/import`
- `GET /api/admin/schedules/excel-template`
- `GET/POST /api/admin/tests`, `GET/PUT/DELETE /api/admin/tests/[id]`
- `GET/POST /api/admin/written-works`, `GET/PUT/DELETE /api/admin/written-works/[id]`
- `GET/POST /api/admin/payments`, `GET/PUT/DELETE /api/admin/payments/[id]`
- `GET /api/admin/market` (products, orders orqali)
- `GET/POST /api/admin/infinity`
- `GET/POST /api/admin/course-feedback`, `PUT/DELETE /api/admin/course-feedback/[id]`
- `GET /api/admin/reports`, `/api/admin/reports/daily-attendance`, `group-results`, `all-students-results`
- `GET /api/admin/visitors`
- `GET/POST /api/admin/messages`
- `GET/POST /api/admin/assistant-admins`, `GET/PUT/DELETE /api/admin/assistant-admins/[id]`
- `GET/POST /api/admin/assistant-tasks`, `GET/PUT/DELETE /api/admin/assistant-tasks/[id]`
- `GET /api/admin/backup`

### Assistant-admin
- `GET /api/assistant-admin/permissions`
- `GET/POST /api/assistant-admin/students`
- `GET /api/assistant-admin/groups`, `POST /api/assistant-admin/groups/[id]/enroll`
- `GET /api/assistant-admin/tasks`, `POST /api/assistant-admin/tasks/[id]/complete`
- `GET/PUT /api/assistant-admin/profile`
- `GET /api/assistant-admin/payments`
- `GET /api/assistant-admin/reports`
- `GET /api/assistant-admin/schedules`
- `GET /api/assistant-admin/tests`
- `GET /api/assistant-admin/teachers`
- `GET /api/assistant-admin/market`

### Umumiy
- `POST /api/visitors/track`
- `GET /api/visitors/count`
- `GET/POST /api/market/products`, `GET/PUT/DELETE /api/market/products/[id]`
- `GET/POST /api/market/orders`, `GET/PUT /api/market/orders/[id]`
- `GET/PUT /api/messages`
- `POST /api/upload`
- `GET/PUT /api/user/infinity`

---

## 10. UI VA RESPONSIVELIK

**Tema:** Qorong'u — slate-900, slate-800, gray-700  
**Accent rash.uz:** yashil (green-500, green-400)  
**Accent rash.com.uz/assistant-admin:** ko'k (blue-500, blue-400)

**Viewport:** device-width, initialScale 1, maximumScale 5, userScalable true  
**Base font:** 16px  
**Touch targets:** min-h-[44px]  
**Jadvallar mobil:** kartochka ko'rinishida

**Student dashboard kartochka ranglari:**
- Davomat: ≥99% yashil, ≥75% sariq, qolgani qizil
- Uydagi topshiriq: ≥75% yashil, ≥40% sariq, qolgani qizil
- O'zlashtirish: ≥81% yashil, ≥50% sariq, qolgani qizil
- O'quvchi qobilyati: ≥70% yashil, ≥30% sariq, qolgani qizil

**Footer:** Tezkor havolalar, Aloqa (tel, Telegram)

---

## 11. FAYL STRUKTURASI

```
app/
  api/              # 70+ API route
  admin/            # Admin sahifalar
  assistant-admin/  # Yordamchi admin sahifalari
  teacher/          # O'qituvchi sahifalari
  student/          # O'quvchi sahifalari
  login/
  layout.tsx, page.tsx, providers.tsx, globals.css
components/
  DashboardLayout.tsx
  Navbar.tsx
  Footer.tsx
  ConditionalLayout.tsx
  VisitorTracker.tsx
  landing/          # PremiumHero, StatsSection, FeaturesSection, CTA, PlatformOverview
  Stats.tsx, Services.tsx, Hero.tsx, Features.tsx, CTA.tsx
  MatrixBackground.tsx
lib/
  auth.ts
  prisma.ts
  utils.ts
  permissions.ts
  student-id-generator.ts
  google-sheets.ts (ixtiyoriy)
  super-admin.ts
  telegram-session.ts
prisma/
  schema.prisma
  schema.production.prisma
middleware.ts
server.js
ecosystem.config.js
next.config.js
tailwind.config.js
types/
  next-auth.d.ts
scripts/
  create-admin.js
  create-student.js
  create-assistant-admin.js
  assign-student-ids.js
  update-student-stats.js
  prepare-production.js
  restore-test-data.js
  switch-to-postgresql.js
```

---

## 12. ENVIRONMENT VA DEPLOYMENT

**ENV o'zgaruvchilari:**
- DATABASE_URL (file:./dev.db yoki production.db)
- NEXTAUTH_URL (https://rash.uz yoki https://rash.com.uz)
- NEXTAUTH_SECRET
- NODE_ENV (development | production)
- PORT (3000)
- HOSTNAME (0.0.0.0)
- GOOGLE_SERVICE_ACCOUNT_CREDENTIALS, GOOGLE_SHEETS_* (ixtiyoriy)

**VPS path:** /var/www/rash  
**PM2:** script server.js, name rash, cwd appDir, instances 1, max_memory_restart 1G  
**Nginx:** proxy_pass localhost:3000  
**Deploy:** git pull → npm ci → prisma generate → prisma db push (yoki migrate) → npm run build → pm2 restart rash

---

## 13. PERMISSIONS TIZIMI (lib/permissions.ts)

**Interface Permission:** view?, create?, edit?, delete?  
**Interface Permissions:** students?, teachers?, groups?, schedules?, tests?, payments?, market?, reports?

**Funksiyalar:**
- `getAssistantAdminPermissions(userId)` → Permissions | null
- `hasPermission(userId, section, permission)` → boolean
- `canView`, `canCreate`, `canEdit`, `canDelete` — wrapper
- `hasSectionAccess(userId, role, section, action)` — ADMIN/MANAGER/SUPER_ADMIN uchun true, ASSISTANT_ADMIN uchun permission tekshiriladi

---

## 14. STUDENT DASHBOARD REAL-TIME

**Stats yangilanish:** har 3 soniyada `fetchStats()`  
**Grades:** har 3 soniyada  
**Messages:** har 60 soniyada  
**Animatsiya:** 2 soniya, 60 qadam, ease-in-out cubic

---

## 15. QO'SHIMCHA DETALLAR

- **Navbar:** Role bo'yicha menyu, logout
- **DashboardLayout:** Role bo'yicha sidebar linklar
- **Format:** formatDateShort — DD/MM/YYYY (O'zbekiston vaqti)
- **Excel import:** o'quvchilar va dars rejalari uchun
- **Backup API:** admin backup endpoint
- **Manifest:** public/manifest.json, public/telegram-manifest.json

---

Bu prompt loyihani to'liq va professional darajada qayta qurish yoki kengaytirish uchun barcha kerakli ma'lumotlarni o'z ichiga oladi.
