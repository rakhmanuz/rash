const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function normalizeLearningMode(value) {
  return value === 'ONLINE' ? 'ONLINE' : 'OFFLINE'
}

async function main() {
  const apply = process.argv.includes('--apply')
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
  const limit = limitArg ? Math.max(1, Number(limitArg.split('=')[1] || 0)) : 10000

  console.log(`[repair-enrollments] mode: ${apply ? 'APPLY' : 'DRY-RUN'}`)

  const students = await prisma.student.findMany({
    select: {
      id: true,
      studentId: true,
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          learningMode: true,
        },
      },
      enrollments: {
        orderBy: { enrolledAt: 'desc' },
        select: {
          id: true,
          isActive: true,
          enrolledAt: true,
          groupId: true,
          group: {
            select: {
              id: true,
              name: true,
              isActive: true,
              learningMode: true,
            },
          },
        },
      },
    },
    take: limit,
  })

  const candidates = students
    .filter((student) => student.enrollments.some((e) => e.isActive) === false)
    .map((student) => {
      const studentMode = normalizeLearningMode(student.user.learningMode)
      const inactive = student.enrollments.filter((e) => !e.isActive)

      const bestMatch =
        inactive.find(
          (e) =>
            e.group &&
            e.group.isActive &&
            normalizeLearningMode(e.group.learningMode) === studentMode
        ) || null

      return {
        student,
        bestMatch,
      }
    })
    .filter((x) => x.bestMatch !== null)

  console.log(`[repair-enrollments] scanned students: ${students.length}`)
  console.log(`[repair-enrollments] recoverable students: ${candidates.length}`)

  if (candidates.length === 0) {
    console.log('[repair-enrollments] nothing to repair.')
    return
  }

  for (const { student, bestMatch } of candidates.slice(0, 30)) {
    console.log(
      `- ${student.studentId} | ${student.user.name} (@${student.user.username}) -> ${bestMatch.group.name} (${normalizeLearningMode(bestMatch.group.learningMode)})`
    )
  }
  if (candidates.length > 30) {
    console.log(`... and ${candidates.length - 30} more`)
  }

  if (!apply) {
    console.log('[repair-enrollments] dry-run complete. Re-run with --apply to persist.')
    return
  }

  let repaired = 0
  await prisma.$transaction(async (tx) => {
    for (const { student, bestMatch } of candidates) {
      await tx.enrollment.update({
        where: { id: bestMatch.id },
        data: { isActive: true },
      })
      repaired += 1
      console.log(
        `[applied] ${student.studentId} -> ${bestMatch.group.name} (${bestMatch.groupId})`
      )
    }
  })

  console.log(`[repair-enrollments] done. repaired: ${repaired}`)
}

main()
  .catch((error) => {
    console.error('[repair-enrollments] failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
