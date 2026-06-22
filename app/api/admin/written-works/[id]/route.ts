import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// DELETE - Delete written work
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      const writtenWork = await tx.writtenWork.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          title: true,
          results: {
            select: {
              id: true,
              infinityAwarded: true,
              student: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      })

      if (!writtenWork) {
        throw new Error('WRITTEN_WORK_NOT_FOUND')
      }

      const deductionByUserId = new Map<string, number>()

      for (const result of writtenWork.results) {
        if (result.infinityAwarded <= 0) continue
        const prev = deductionByUserId.get(result.student.userId) ?? 0
        deductionByUserId.set(result.student.userId, prev + result.infinityAwarded)
      }

      for (const [userId, amount] of deductionByUserId.entries()) {
        const row = await tx.user.findUnique({
          where: { id: userId },
          select: { infinityPoints: true },
        })
        const currentPoints = row?.infinityPoints ?? 0
        const nextPoints = Math.max(0, currentPoints - amount)
        await tx.user.update({
          where: { id: userId },
          data: { infinityPoints: nextPoints },
        })
        await tx.infinityHistory.create({
          data: {
            userId,
            amount: -amount,
            balanceAfter: nextPoints,
            source: 'ADMIN_SUBTRACT',
            description: `Yozma ish o'chirildi: ${writtenWork.title || 'yozma ish'} uchun berilgan ∞ qaytarib olindi (${amount})`,
            referenceId: writtenWork.id,
          },
          select: { id: true },
        })
      }

      await tx.writtenWorkResult.deleteMany({
        where: { writtenWorkId: params.id },
      })

      await tx.writtenWork.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({ message: 'Written work deleted' })
  } catch (error) {
    if (error instanceof Error && error.message === 'WRITTEN_WORK_NOT_FOUND') {
      return NextResponse.json({ error: 'Yozma ish topilmadi' }, { status: 404 })
    }
    console.error('Error deleting written work:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
