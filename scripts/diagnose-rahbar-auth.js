/**
 * Serverda: qaysi bazaga ulanayotganini va `rahbar` foydalanuvchisini ko‘rsatadi.
 * cd /var/www/rash && node scripts/diagnose-rahbar-auth.js
 */
const { loadEnv } = require('./load-env')
loadEnv()

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function maskDbUrl(url) {
  if (!url) return '(schema prisma dagi default)'
  if (url.includes('postgresql') || url.includes('mysql')) {
    return url.replace(/:([^:@/]+)@/, ':****@')
  }
  return url
}

async function main() {
  console.log('cwd:', process.cwd())
  console.log('DATABASE_URL:', maskDbUrl(process.env.DATABASE_URL))

  try {
    const list = await prisma.$queryRawUnsafe('PRAGMA database_list')
    console.log('SQLite PRAGMA database_list:', list)
  } catch {
    console.log('SQLite emas yoki PRAGMA qo‘llanmadi (PostgreSQL bo‘lishi mumkin).')
  }

  const u = await prisma.user.findUnique({
    where: { username: 'rahbar' },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      isActive: true,
      password: true,
    },
  })

  if (!u) {
    console.log('\n❌ username=rahbar bazada YO‘Q (noto‘g‘ri DB yoki foydalanuvchi yaratilmagan).')
  } else {
    const hashOk = u.password && u.password.startsWith('$2')
    console.log('\n✅ rahbar topildi:', {
      id: u.id,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      passwordLooksLikeBcrypt: hashOk,
    })
  }

  const count = await prisma.user.count()
  console.log('\nJami User yozuvlari:', count)
}

main()
  .catch((e) => {
    console.error('Xatolik:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
