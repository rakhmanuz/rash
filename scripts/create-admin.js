const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Admin foydalanuvchi yaratilmoqda...')

  // Parolni hash qilish
  const password = process.argv[2] || 'admin123'
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    // Admin foydalanuvchi yaratish
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        name: 'Admin',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    })

    console.log('✅ Admin foydalanuvchi muvaffaqiyatli yaratildi!')
    console.log('👤 Login:', admin.username)
    console.log('🔑 Parol:', password)
    console.log('👤 Role:', admin.role)
    console.log('\n⚠️  Eslatma: Parolni eslab qoling va keyin o\'zgartiring!')
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('❌ Bu login allaqachon mavjud!')
      console.log('Agar parolni o\'zgartirmoqchi bo\'lsangiz, Prisma Studio\'dan foydalaning:')
      console.log('   npx prisma studio')
    } else {
      console.error('❌ Xatolik:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()
