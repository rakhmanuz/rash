const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Email\'dan username\'ga migration boshlandi...\n')

  try {
    // Barcha user'larni olish
    const users = await prisma.$queryRaw`
      SELECT id, email FROM User
    `

    console.log(`${users.length} ta foydalanuvchi topildi\n`)

    // Har bir user uchun email'dan username yaratish
    for (const user of users) {
      if (user.email) {
        // Email'dan @ oldidagi qismni olish
        const username = user.email.split('@')[0]
        
        console.log(`Migrating: ${user.email} -> ${username}`)

        // Username'ni yangilash
        await prisma.$executeRaw`
          UPDATE User 
          SET username = ${username}
          WHERE id = ${user.id}
        `
      }
    }

    console.log('\n✅ Migration muvaffaqiyatli yakunlandi!')
    console.log('Endi database schema\'ni yangilash mumkin: npm run db:push')
  } catch (error) {
    console.error('❌ Migration xatolik:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
