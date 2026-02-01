const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('=== Admin Parolni Yangilash ===\n')

  // Parametrlarni olish
  const username = process.argv[2]
  const newPassword = process.argv[3]

  if (!username || !newPassword) {
    console.log('❌ Xatolik: Login va parol kiritilishi kerak!')
    console.log('\nIshlatish:')
    console.log('   node scripts/update-admin-password.js <login> <yangi-parol>')
    console.log('\nMisol:')
    console.log('   node scripts/update-admin-password.js admin yangiParol123')
    process.exit(1)
  }

  try {
    // Foydalanuvchini topish
    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user) {
      console.log(`❌ Xatolik: "${username}" login bilan foydalanuvchi topilmadi!`)
      process.exit(1)
    }

    // Yangi parolni hash qilish
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Parolni yangilash
    await prisma.user.update({
      where: { username },
      data: {
        password: hashedPassword,
      },
    })

    console.log('✅ Parol muvaffaqiyatli yangilandi!\n')
    console.log('📋 Ma\'lumotlar:')
    console.log('   👤 Login:', username)
    console.log('   🔑 Yangi Parol:', newPassword)
    console.log('\n⚠️  MUHIM: Yangi parolni eslab qoling va xavfsiz joyda saqlang!')
  } catch (error) {
    console.error('❌ Xatolik:', error.message)
    console.error('   Detaylar:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
