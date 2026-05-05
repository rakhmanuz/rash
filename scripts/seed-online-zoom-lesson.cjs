/**
 * Bir martalik: "online" guruhiga jadval qatoriga Zoom havolasini yozadi.
 * Ishlatish: set ZOOM_JOIN_URL=... && node scripts/seed-online-zoom-lesson.cjs
 */
const { PrismaClient } = require('@prisma/client')

const joinUrl = process.env.ZOOM_JOIN_URL?.trim()
if (!joinUrl || !joinUrl.startsWith('http')) {
  console.error('ZOOM_JOIN_URL muhit o\'zgaruvchisini to\'g\'ri havola bilan o\'rnating.')
  process.exit(1)
}

async function main() {
  const prisma = new PrismaClient()
  try {
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { name: { contains: 'online' } },
          { name: { contains: 'Online' } },
          { name: { contains: 'ONLINE' } },
        ],
      },
      select: { id: true, name: true, learningMode: true },
    })

    const online = groups.find((g) => /online/i.test(g.name))
    if (!online) {
      console.error('Hech qanday "online" guruh topilmadi. Mavjud guruhlar:', groups)
      process.exit(1)
    }

    const date = new Date('2026-05-02T12:00:00.000+05:00')
    const times = JSON.stringify(['12:00'])

    const existing = await prisma.classSchedule.findFirst({
      where: { groupId: online.id, date },
    })

    if (existing) {
      await prisma.classSchedule.update({
        where: { id: existing.id },
        data: { notes: joinUrl, times },
      })
      console.log('Yangilandi:', existing.id, online.name)
    } else {
      const created = await prisma.classSchedule.create({
        data: {
          groupId: online.id,
          date,
          times,
          notes: joinUrl,
        },
      })
      console.log('Yaratildi:', created.id, online.name)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
