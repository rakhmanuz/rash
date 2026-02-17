const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Barcha bo'limlar uchun to'liq ruxsatlar (view, create, edit, delete)
const FULL_PERMISSIONS = JSON.stringify({
  students: { view: true, create: true, edit: true, delete: true },
  teachers: { view: true, create: true, edit: true, delete: true },
  groups: { view: true, create: true, edit: true, delete: true },
  schedules: { view: true, create: true, edit: true, delete: true },
  tests: { view: true, create: true, edit: true, delete: true },
  payments: { view: true, create: true, edit: true, delete: true },
  market: { view: true, create: true, edit: true, delete: true },
  reports: { view: true, create: true, edit: true, delete: true },
})

async function ensureAssistantAdminProfile(userId) {
  const existing = await prisma.assistantAdmin.findUnique({
    where: { userId },
  })
  if (existing) {
    await prisma.assistantAdmin.update({
      where: { userId },
      data: { permissions: FULL_PERMISSIONS },
    })
    return
  }
  await prisma.assistantAdmin.create({
    data: {
      userId,
      permissions: FULL_PERMISSIONS,
    },
  })
}

async function main() {
  console.log('Yordamchi Admin foydalanuvchi yaratilmoqda...')

  const username = 'admin1'
  const password = '123456'
  const name = 'Yordamchi Admin'
  
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: {
        username: username,
        name: name,
        password: hashedPassword,
        role: 'ASSISTANT_ADMIN',
        isActive: true,
      },
    })
    await ensureAssistantAdminProfile(user.id)

    console.log('\n✅ Yordamchi Admin foydalanuvchi muvaffaqiyatli yaratildi!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👤 Login:', user.username)
    console.log('🔑 Parol:', password)
    console.log('👤 Role:', user.role)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n🌐 Kirish: http://rash.com.uz:3000/login')
    console.log('⚠️  Eslatma: Parolni eslab qoling!')
  } catch (error) {
    if (error.code === 'P2002') {
      const updated = await prisma.user.update({
        where: { username: username },
        data: {
          password: hashedPassword,
          role: 'ASSISTANT_ADMIN',
          isActive: true,
        },
      })
      await ensureAssistantAdminProfile(updated.id)
      console.log('\n✅ Mavjud foydalanuvchi yangilandi!')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('👤 Login:', updated.username)
      console.log('🔑 Parol:', password)
      console.log('👤 Role:', updated.role)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('\n🌐 Kirish: http://rash.com.uz:3000/login')
    } else {
      console.error('❌ Xatolik:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()
