const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('=== Admin Foydalanuvchi Yaratish ===\n')

  // Parametrlarni olish
  const username = process.argv[2] || 'admin'
  const password = process.argv[3] || 'admin123'
  const name = process.argv[4] || 'Admin'

  // Parolni hash qilish
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    // Avval username mavjudligini tekshirish
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      console.log('⚠️  Bu login allaqachon mavjud!')
      console.log('Agar parolni o\'zgartirmoqchi bo\'lsangiz, quyidagi buyruqni ishlating:')
      console.log(`   node scripts/update-admin-password.js ${username} <yangi-parol>`)
      console.log('\nYoki Prisma Studio\'dan foydalaning:')
      console.log('   npx prisma studio')
      return
    }

    // Admin foydalanuvchi yaratish
    const admin = await prisma.user.create({
      data: {
        username: username,
        name: name,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    })

    console.log('✅ Admin foydalanuvchi muvaffaqiyatli yaratildi!\n')
    console.log('📋 Ma\'lumotlar:')
    console.log('   👤 Login:', admin.username)
    console.log('   🔑 Parol:', password)
    console.log('   📛 Ism:', admin.name)
    console.log('   👑 Role:', admin.role)
    console.log('   ✅ Status: Active')
    console.log('\n⚠️  MUHIM: Parolni eslab qoling va xavfsiz joyda saqlang!')
    console.log('   Login qilish uchun: https://rash.uz/login')
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('❌ Bu login allaqachon mavjud!')
      console.log('Agar parolni o\'zgartirmoqchi bo\'lsangiz, quyidagi buyruqni ishlating:')
      console.log(`   node scripts/update-admin-password.js ${username} <yangi-parol>`)
    } else {
      console.error('❌ Xatolik:', error.message)
      console.error('   Detaylar:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()
