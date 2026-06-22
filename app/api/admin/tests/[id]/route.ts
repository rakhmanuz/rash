import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get single test
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        results: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    return NextResponse.json(test)
  } catch (error) {
    console.error('Error fetching test:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - Delete test
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
      const test = await tx.test.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          title: true,
          type: true,
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

      if (!test) {
        throw new Error('TEST_NOT_FOUND')
      }

      const deductionByUserId = new Map<string, number>()

      for (const result of test.results) {
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
            description: `Topshiriq o'chirildi: ${test.title || test.type || 'test'} uchun berilgan ∞ qaytarib olindi (${amount})`,
            referenceId: test.id,
          },
          select: { id: true },
        })
      }

      await tx.testResult.deleteMany({
        where: { testId: params.id },
      })

      await tx.test.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({ message: 'Test deleted' })
  } catch (error) {
    if (error instanceof Error && error.message === 'TEST_NOT_FOUND') {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }
    console.error('Error deleting test:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
