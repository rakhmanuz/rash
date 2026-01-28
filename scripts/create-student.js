const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('O\'quvchi foydalanuvchi yaratilmoqda...')

  // Parolni hash qilish
  const password = process.argv[2] || 'student123'
  const hashedPassword = await bcrypt.hash(password, 10)

  // Student ID yaratish
  const studentId = `STU${Date.now().toString().slice(-6)}`

  try {
    // O'quvchi foydalanuvchi yaratish
    const user = await prisma.user.create({
      data: {
        username: 'student',
        name: 'Test O\'quvchi',
        password: hashedPassword,
        role: 'STUDENT',
        isActive: true,
        studentProfile: {
          create: {
            studentId: studentId,
            level: 1,
            totalScore: 0,
            attendanceRate: 0,
            masteryLevel: 0,
          },
        },
      },
      include: {
        studentProfile: true,
      },
    })

    console.log('✅ O\'quvchi foydalanuvchi muvaffaqiyatli yaratildi!')
    console.log('👤 Login:', user.username)
    console.log('🔑 Parol:', password)
    console.log('🆔 O\'quvchi ID:', user.studentProfile.studentId)
    console.log('👤 Role:', user.role)
    console.log('\n⚠️  Eslatma: Parolni eslab qoling!')
    console.log('\n🌐 Endi http://localhost:3000/login ga kiring va kirish qiling!')
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('❌ Bu login allaqachon mavjud!')
      console.log('Agar parolni o\'zgartirmoqchi bo\'lsangiz, admin panelidan foydalaning:')
      console.log('   http://localhost:3000/admin/students')
    } else {
      console.error('❌ Xatolik:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()
