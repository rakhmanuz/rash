const fs = require('fs')
const path = require('path')

console.log('🔄 Database provider PostgreSQL\'ga o\'zgartirilmoqda...\n')

const schemaPath = path.join(__dirname, '../prisma/schema.prisma')
let schema = fs.readFileSync(schemaPath, 'utf-8')

// SQLite'dan PostgreSQL'ga o'zgartirish
schema = schema.replace(
  /provider = "sqlite"/g,
  'provider = "postgresql"'
)

fs.writeFileSync(schemaPath, schema)

console.log('✅ Prisma schema PostgreSQL uchun yangilandi!')
console.log('\n📝 Keyingi qadamlar:')
console.log('   1. .env faylida DATABASE_URL ni PostgreSQL connection string ga o\'zgartiring')
console.log('   2. npx prisma generate - Prisma Client yangilang')
console.log('   3. npx prisma db push - Database\'ga schema push qiling')
console.log('   4. npm run create-admin - Admin user yarating\n')
