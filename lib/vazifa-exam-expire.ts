import { prisma } from '@/lib/prisma'

const TIMER_PLACEHOLDER =
  '[Tizim] Imtihon vaqti tugadi. Brauzer yopilgan yoki aloqa uzilgan bo‘lishi mumkin — javob matni saqlanmagan.'

/** Muddati o‘tgan, lekin yopilmagan urinishlarni yopib, placeholder topshirish yozadi */
export async function expireOpenAttemptsForStudent(studentProfileId: string) {
  const now = new Date()
  const stale = await prisma.vazifaExamAttempt.findMany({
    where: {
      studentId: studentProfileId,
      endedAt: null,
      deadlineAt: { lt: now },
    },
  })

  for (const open of stale) {
    await prisma.$transaction(async (tx) => {
      await tx.vazifaExamSubmission.create({
        data: {
          studentId: studentProfileId,
          content: TIMER_PLACEHOLDER,
          startedAt: open.startedAt,
          attemptId: open.id,
          closedByTimer: true,
        },
      })
      await tx.vazifaExamAttempt.update({
        where: { id: open.id },
        data: { endedAt: now, autoEnded: true },
      })
    })
  }
}
