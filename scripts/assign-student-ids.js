const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const STARTING_ID = 1070010

async function main() {
  console.log('Mavjud o\'quvchilar uchun ID belgilash boshlandi...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  let assigned = 0
  let skipped = 0
  let currentId = STARTING_ID

  try {
    // Barcha o'quvchilarni olish
    const students = await prisma.student.findMany({
      orderBy: {
        createdAt: 'asc', // Eski o'quvchilardan boshlab
      },
    })

    console.log(`\n📊 Jami o'quvchilar: ${students.length} ta`)
    console.log('⏳ ID belgilanmoqda...\n')

    for (const student of students) {
      // Agar studentId raqamli va 1070010 dan katta bo'lsa, o'tkazib yuborish
      const numericId = parseInt(student.studentId, 10)
      if (!isNaN(numericId) && numericId >= STARTING_ID) {
        skipped++
        // Eng katta ID'ni kuzatish
        if (numericId >= currentId) {
          currentId = numericId + 1
        }
        continue
      }

      // Yangi ID belgilash
      const newId = currentId.toString()
      
      // ID mavjudligini tekshirish
      const existing = await prisma.student.findUnique({
        where: { studentId: newId },
      })

      if (existing) {
        // Agar ID mavjud bo'lsa, keyingi raqamni ishlatish
        currentId++
        continue
      }

      // ID'ni yangilash
      await prisma.student.update({
        where: { id: student.id },
        data: { studentId: newId },
      })

      assigned++
      currentId++
      
      if (assigned % 10 === 0) {
        process.stdout.write(`\r✅ ${assigned} ta o'quvchi ID belgilandi...`)
      }
    }

    console.log('\n\n✅ ID belgilash yakunlandi!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📝 Belgilangan: ${assigned} ta o'quvchi`)
    console.log(`⏭️  O'tkazib yuborilgan: ${skipped} ta o'quvchi (allaqachon ID mavjud)`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n💡 Endi barcha yangi o\'quvchilar avtomatik ID oladi (1070010 dan boshlab)')
  } catch (error) {
    console.error('\n❌ Xatolik:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
