/**
 * Rahbar foydalanuvchini yaratish yoki parol/rolni yangilash (login muammosi uchun).
 * Ishlatish: node scripts/upsert-rahbar-user.js <username> <ism> <parol>
 * Misol: node scripts/upsert-rahbar-user.js rahbar "Rahbar" yangiParol123
 *
 * Agar login allaqachon bo'lsa — parol RAHBAR rol va isActive=true ga yangilanadi.
 *
 * MUHIM: .env yuklanadi — sayt bilan bir xil DATABASE_URL ishlatiladi (diagnose: scripts/diagnose-rahbar-auth.js).
 */
const { loadEnv } = require('./load-env')
loadEnv()

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const username = (process.argv[2] || '').trim()
  const name = (process.argv[3] || '').trim()
  const password = (process.argv[4] || '').trim()

  if (!username || !name || !password) {
    console.log('Ishlatish: node scripts/upsert-rahbar-user.js <username> <ism> <parol>')
    console.log('Misol: node scripts/upsert-rahbar-user.js rahbar "Rahbar" yangiParol123')
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const existing = await prisma.user.findUnique({ where: { username } })

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        password: hashedPassword,
        role: 'RAHBAR',
        isActive: true,
      },
    })
    console.log('✅ Foydalanuvchi yangilandi (parol, rol RAHBAR, faol)')
    console.log('👤 Login:', username)
  } else {
    await prisma.user.create({
      data: {
        username,
        name,
        password: hashedPassword,
        role: 'RAHBAR',
        isActive: true,
      },
    })
    console.log('✅ Yangi RAHBAR foydalanuvchi yaratildi')
    console.log('👤 Login:', username)
  }
}

main()
  .catch((e) => {
    console.error('❌ Xatolik:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
