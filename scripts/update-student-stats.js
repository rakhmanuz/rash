const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('O\'quvchi statistikasini yangilash...')

  try {
    // O'quvchi foydalanuvchini topish
    const user = await prisma.user.findUnique({
      where: { email: 'student@rash.uz' },
      include: { studentProfile: true },
    })

    if (!user || !user.studentProfile) {
      console.log('❌ O\'quvchi topilmadi! Avval o\'quvchi yaratish kerak: npm run create-student')
      return
    }

    // Test statistikasini yangilash
    await prisma.student.update({
      where: { id: user.studentProfile.id },
      data: {
        attendanceRate: 95, // 95%
        masteryLevel: 70,   // 70%
        level: 4,            // B+ uchun level 4 (A=5, B+=4, B=3, C=2, D=1)
        totalScore: 850,    // Umumiy ball
      },
    })
    console.log('✅ O\'quvchi statistikasi yangilandi')

    // Qarzdorlik yaratish (500,000)
    // Avval mavjud PENDING to'lovlarni o'chirish
    await prisma.payment.deleteMany({
      where: {
        studentId: user.studentProfile.id,
        status: 'PENDING',
      },
    })

    // Yangi qarzdorlik yaratish
    await prisma.payment.create({
      data: {
        studentId: user.studentProfile.id,
        amount: 500000,
        type: 'TUITION',
        status: 'PENDING',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 kun keyin
        notes: 'Test qarzdorlik',
      },
    })
    console.log('✅ Qarzdorlik yaratildi: 500,000 so\'m')

    // Group topish yoki yaratish
    let group = await prisma.group.findFirst()
    if (!group) {
      // Test teacher yaratish yoki topish
      let teacher = await prisma.user.findFirst({
        where: { role: 'TEACHER' },
        include: { teacherProfile: true },
      })

      if (!teacher || !teacher.teacherProfile) {
        // Test teacher yaratish
        const hashedPassword = await bcrypt.hash('teacher123', 10)
        
        teacher = await prisma.user.create({
          data: {
            email: 'teacher@rash.uz',
            name: 'Test O\'qituvchi',
            password: hashedPassword,
            role: 'TEACHER',
            isActive: true,
            teacherProfile: {
              create: {
                teacherId: `TCH${Date.now().toString().slice(-6)}`,
                baseSalary: 0,
                bonusRate: 0,
                totalEarnings: 0,
              },
            },
          },
          include: { teacherProfile: true },
        })
        console.log('✅ Test o\'qituvchi yaratildi')
      }

      if (teacher && teacher.teacherProfile) {
        group = await prisma.group.create({
          data: {
            name: 'Test Guruh',
            teacherId: teacher.teacherProfile.id,
            maxStudents: 20,
            isActive: true,
          },
        })
        console.log('✅ Test guruh yaratildi')
      }
    }

    // Test uchun davomat yaratish (95% uchun)
    // 20 ta davomatdan 19 tasi present
    const existingAttendances = await prisma.attendance.count({
      where: { studentId: user.studentProfile.id },
    })

    if (existingAttendances === 0 && group) {
      // 20 ta davomat yaratish (19 ta present, 1 ta absent)
      for (let i = 0; i < 20; i++) {
        await prisma.attendance.create({
          data: {
            studentId: user.studentProfile.id,
            groupId: group.id,
            date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000),
            isPresent: i < 19, // 19 ta present, 1 ta absent
          },
        })
      }
      console.log('✅ 20 ta davomat yaratildi (19 ta present, 1 ta absent = 95%)')
    }

    // Test baholar yaratish (70% o'rtacha uchun)
    const existingGrades = await prisma.grade.count({
      where: { studentId: user.studentProfile.id },
    })

    if (existingGrades === 0 && group) {
      const teacherForGrades = await prisma.user.findFirst({
        where: { role: 'TEACHER' },
        include: { teacherProfile: true },
      })

      if (teacherForGrades && teacherForGrades.teacherProfile) {
        // 5 ta baho yaratish (70% o'rtacha)
        const grades = [
          { score: 75, maxScore: 100 }, // 75%
          { score: 70, maxScore: 100 }, // 70%
          { score: 65, maxScore: 100 }, // 65%
          { score: 75, maxScore: 100 }, // 75%
          { score: 65, maxScore: 100 }, // 65%
        ]

        for (let i = 0; i < grades.length; i++) {
          await prisma.grade.create({
            data: {
              studentId: user.studentProfile.id,
              teacherId: teacherForGrades.teacherProfile.id,
              groupId: group.id,
              score: grades[i].score,
              maxScore: grades[i].maxScore,
              type: 'test',
              notes: `Test baho ${i + 1}`,
            },
          })
        }
        console.log('✅ 5 ta test baho yaratildi (o\'rtacha ~70%)')
      }
    }

    console.log('\n✅ O\'quvchi statistikasi muvaffaqiyatli yangilandi!')
    console.log('📊 Yangi statistikalar:')
    console.log('   - Davomat: 95%')
    console.log('   - O\'zlashtirish: 70%')
    console.log('   - Bilim darajasi: Level 4 (B+)')
    console.log('   - Qarzdorlik: 500,000 so\'m')
    console.log('\n🌐 Endi o\'quvchi paneliga kiring va yangi statistikalarni ko\'ring!')
  } catch (error) {
    console.error('❌ Xatolik:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
