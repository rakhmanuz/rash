const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Test ma\'lumotlari yaratilmoqda...\n')

  try {
    // 1. Admin user yaratish
    const adminPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        name: 'Admin',
        password: adminPassword,
        role: 'ADMIN',
        isActive: true,
      },
    })
    console.log('✅ Admin user yaratildi/yangilandi')
    console.log('   Login: admin')
    console.log('   Parol: admin123\n')

    // 2. Teacher user yaratish
    const teacherPassword = await bcrypt.hash('teacher123', 10)
    const teacherUser = await prisma.user.upsert({
      where: { username: 'teacher' },
      update: {},
      create: {
        username: 'teacher',
        name: 'Test O\'qituvchi',
        password: teacherPassword,
        role: 'TEACHER',
        isActive: true,
        teacherProfile: {
          create: {
            teacherId: 'TCH001',
            baseSalary: 5000000,
            bonusRate: 10,
            totalEarnings: 5500000,
          },
        },
      },
      include: { teacherProfile: true },
    })
    console.log('✅ Teacher user yaratildi/yangilandi')
    console.log('   Login: teacher')
    console.log('   Parol: teacher123\n')

    // 3. Group yaratish
    const group = await prisma.group.upsert({
      where: { id: 'group-1' },
      update: {},
      create: {
        id: 'group-1',
        name: 'Matematika - 1-guruh',
        description: 'Boshlang\'ich matematika guruhi',
        teacherId: teacherUser.teacherProfile.id,
        maxStudents: 20,
        isActive: true,
      },
    })
    console.log('✅ Group yaratildi/yangilandi')
    console.log('   Nomi: Matematika - 1-guruh\n')

    // 4. Student users yaratish
    const students = [
      { username: 'student1', name: 'Ali Valiyev', studentId: 'STU001' },
      { username: 'student2', name: 'Vali Aliyev', studentId: 'STU002' },
      { username: 'student3', name: 'Hasan Hasanov', studentId: 'STU003' },
    ]

    for (const studentData of students) {
      const studentPassword = await bcrypt.hash('student123', 10)
      const studentUser = await prisma.user.upsert({
        where: { username: studentData.username },
        update: {},
        create: {
          username: studentData.username,
          name: studentData.name,
          password: studentPassword,
          role: 'STUDENT',
          isActive: true,
          studentProfile: {
            create: {
              studentId: studentData.studentId,
              level: Math.floor(Math.random() * 3) + 2, // 2-4
              totalScore: Math.floor(Math.random() * 500) + 500,
              attendanceRate: Math.floor(Math.random() * 20) + 80, // 80-100
              masteryLevel: Math.floor(Math.random() * 30) + 60, // 60-90
            },
          },
        },
        include: { studentProfile: true },
      })

      // Student'ni group'ga enroll qilish
      await prisma.enrollment.upsert({
        where: {
          studentId_groupId: {
            studentId: studentUser.studentProfile.id,
            groupId: group.id,
          },
        },
        update: { isActive: true },
        create: {
          studentId: studentUser.studentProfile.id,
          groupId: group.id,
          isActive: true,
        },
      })

      console.log(`✅ Student yaratildi/yangilandi: ${studentData.name}`)
      console.log(`   Login: ${studentData.username}`)
      console.log(`   Parol: student123`)
    }

    console.log('\n✅ Barcha test ma\'lumotlari muvaffaqiyatli yaratildi!')
    console.log('\n📋 Login ma\'lumotlari:')
    console.log('   Admin:')
    console.log('     Login: admin')
    console.log('     Parol: admin123')
    console.log('   Teacher:')
    console.log('     Login: teacher')
    console.log('     Parol: teacher123')
    console.log('   Students:')
    console.log('     Login: student1, student2, student3')
    console.log('     Parol: student123 (hamma uchun)')
    console.log('\n🌐 Endi http://localhost:3000/login ga kiring va test qiling!')

  } catch (error) {
    console.error('❌ Xatolik:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
