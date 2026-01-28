const fs = require('fs')
const path = require('path')

console.log('🚀 Production uchun tayyorgarlik...\n')

// 1. Prisma schema'ni yangilash
console.log('1. Prisma schema yangilanmoqda...')
const productionSchema = fs.readFileSync(
  path.join(__dirname, '../prisma/schema.production.prisma'),
  'utf-8'
)
fs.writeFileSync(
  path.join(__dirname, '../prisma/schema.prisma'),
  productionSchema
)
console.log('✅ Prisma schema PostgreSQL uchun yangilandi\n')

// 2. .env.production yaratish
console.log('2. .env.production fayli yaratilmoqda...')
const envProduction = `# Production Environment Variables
# Bu faylni hosting provider'da environment variables sifatida qo'shing

# Database - PostgreSQL (hosting provider'dan oling)
DATABASE_URL="postgresql://username:password@host:5432/rash?schema=public"

# NextAuth
NEXTAUTH_URL="https://rash.uz"
NEXTAUTH_SECRET="CHANGE-THIS-TO-A-STRONG-RANDOM-STRING-MINIMUM-32-CHARACTERS"

# Production
NODE_ENV="production"
`

fs.writeFileSync(
  path.join(__dirname, '../.env.production'),
  envProduction
)
console.log('✅ .env.production fayli yaratildi\n')

// 3. Build test
console.log('3. Build test qilinmoqda...')
console.log('⚠️  Keyingi qadamlar:')
console.log('   1. .env.production faylini to\'ldiring')
console.log('   2. npm run build - build test qiling')
console.log('   3. Hosting provider\'ga yuklang')
console.log('   4. Environment variables qo\'shing')
console.log('   5. Database migration qiling: npx prisma migrate deploy')
console.log('   6. Admin user yarating: npm run create-admin\n')

console.log('📖 Batafsil qo\'llanma: PRODUCTION_DEPLOYMENT.md faylini o\'qing\n')
