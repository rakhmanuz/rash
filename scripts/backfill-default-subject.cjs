/**
 * Markaz ilgari asosan bitta fan (masalan Matematika) uchun bo'lsa:
 * - Subject yozuvini yaratadi yoki mavjud nomni ishlatadi
 * - Standart: subjectId bo'sh bo'lgan guruhlarni shu fanga bog'laydi
 * - --all yoki -a: BARCHA guruhlarni shu fanga bog'laydi (mavjud fan bog'lanishi almashtiriladi)
 *
 * Ishlatish:
 *   node scripts/backfill-default-subject.cjs
 *   node scripts/backfill-default-subject.cjs --all
 *   node scripts/backfill-default-subject.cjs "Ingliz tili" --all
 */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const argv = process.argv.slice(2)
  const allGroups = argv.includes('--all') || argv.includes('-a')
  const nameArg = argv.find((a) => !a.startsWith('-'))
  const subjectName = (nameArg || 'Matematika').trim() || 'Matematika'

  let subject = await prisma.subject.findFirst({
    where: { name: subjectName },
  })
  if (!subject) {
    subject = await prisma.subject.create({
      data: { name: subjectName, sortOrder: 0, isActive: true },
    })
    console.log('Yaratildi:', subject.id, subject.name)
  } else {
    console.log('Mavjud fan:', subject.id, subject.name)
  }

  const total = await prisma.group.count()

  if (allGroups) {
    const updated = await prisma.group.updateMany({
      data: { subjectId: subject.id },
    })
    console.log('Barcha guruhlar yangilandi:', updated.count, '/', total)
  } else {
    const updated = await prisma.group.updateMany({
      where: { subjectId: null },
      data: { subjectId: subject.id },
    })
    console.log("subjectId bo'sh bo'lgan guruhlar yangilandi:", updated.count, '(jami guruhlar:', total + ')')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
