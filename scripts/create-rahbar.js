/**
 * Rahbar foydalanuvchi yaratish (faqat hisobotlar paneli).
 * Ishlatish: node scripts/create-rahbar.js <username> <ism> [parol]
 * Misol: node scripts/create-rahbar.js rahbar1 "Ali Rahbar" meningParolim
 *
 * Login ishlamasa yoki parolni yangilash kerak bo‘lsa: scripts/upsert-rahbar-user.js
 */
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const username = (process.argv[2] || '').trim()
  const name = (process.argv[3] || '').trim()
  const password = process.argv[4] || 'rahbar123'

  if (!username || !name) {
    console.log('Ishlatish: node scripts/create-rahbar.js <username> <ism> [parol]')
    console.log('Misol: node scripts/create-rahbar.js rahbar1 "Ali Valiyev" meningParolim')
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: {
        username,
        name,
        password: hashedPassword,
        role: 'RAHBAR',
        isActive: true,
      },
    })

    console.log('✅ Rahbar foydalanuvchi yaratildi')
    console.log('👤 Login:', user.username)
    console.log('📛 Ism:', user.name)
    console.log('🔑 Parol:', password)
    console.log('🎭 Rol:', user.role)
    console.log('\n⚠️  Parolni xavfsiz joyda saqlang va kerak bo‘lsa o‘zgartiring.')
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('❌ Bu login allaqachon mavjud')
    } else {
      console.error('❌ Xatolik:', error.message)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
