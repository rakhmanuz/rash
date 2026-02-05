const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Yordamchi Admin foydalanuvchi yaratilmoqda...')

  const username = 'admin1'
  const password = 'uzbek4321'
  const name = 'Yordamchi Admin'
  
  // Parolni hash qilish
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    // Yordamchi admin foydalanuvchi yaratish
    const assistantAdmin = await prisma.user.create({
      data: {
        username: username,
        name: name,
        password: hashedPassword,
        role: 'ASSISTANT_ADMIN',
        isActive: true,
      },
    })

    console.log('\n✅ Yordamchi Admin foydalanuvchi muvaffaqiyatli yaratildi!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👤 Login:', assistantAdmin.username)
    console.log('🔑 Parol:', password)
    console.log('👤 Role:', assistantAdmin.role)
    console.log('📧 Ism:', assistantAdmin.name)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n🌐 Kirish: http://localhost:3000/assistant-admin/dashboard')
    console.log('⚠️  Eslatma: Parolni eslab qoling!')
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('\n❌ Bu login allaqachon mavjud!')
      console.log('Agar parolni o\'zgartirmoqchi bo\'lsangiz yoki rolni yangilamoqchi bo\'lsangiz:')
      console.log('   1. Prisma Studio\'dan foydalaning: npx prisma studio')
      console.log('   2. Yoki bu skriptni o\'zgartiring va role ni yangilang')
      
      // Mavjud foydalanuvchini yangilash
      try {
        const updated = await prisma.user.update({
          where: { username: username },
          data: {
            password: hashedPassword,
            role: 'ASSISTANT_ADMIN',
            isActive: true,
          },
        })
        console.log('\n✅ Mavjud foydalanuvchi yangilandi!')
        console.log('👤 Login:', updated.username)
        console.log('🔑 Parol:', password)
        console.log('👤 Role:', updated.role)
      } catch (updateError) {
        console.error('❌ Yangilashda xatolik:', updateError.message)
      }
    } else {
      console.error('❌ Xatolik:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()
