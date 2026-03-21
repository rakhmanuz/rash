import { NextRequest, NextResponse } from 'next/server'
import { prisma, type PrismaTransactionClient } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getInfinityForPercent } from '@/lib/utils'

// POST - Create or update test result
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teacherProfile: {
          include: {
            groups: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    if (!user || !user.teacherProfile) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { testId, studentId, correctAnswers, notes } = body

    if (!testId || !studentId || correctAnswers === undefined) {
      return NextResponse.json(
        { error: 'TestId, studentId va correctAnswers kerak' },
        { status: 400 }
      )
    }

    // Check if test belongs to teacher's group
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        group: true,
      },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    const teacherGroupIds = user.teacherProfile.groups.map(g => g.id)
    if (!teacherGroupIds.includes(test.groupId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if correctAnswers is not greater than totalQuestions
    if (correctAnswers > test.totalQuestions) {
      return NextResponse.json(
        { error: `To'g'ri javoblar soni umumiy savollar sonidan ko'p bo'lishi mumkin emas` },
        { status: 400 }
      )
    }

    const correct = parseInt(correctAnswers)
    const total = test.totalQuestions
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0
    // Infinity faqat kunlik test uchun; uyga vazifa uchun berilmaydi
    const newInfinity = test.type === 'kunlik_test' ? getInfinityForPercent(percent) : 0

    // Barcha o'qish va yozish transaction ichida — bir xil test+o'quvchi uchun ikki so'rov dublikat yaratmaydi
    const result = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const [existing, studentRow] = await Promise.all([
        tx.testResult.findUnique({
          where: { testId_studentId: { testId, studentId } },
          select: { infinityAwarded: true },
        }),
        tx.student.findUnique({
          where: { id: studentId },
          select: { user: { select: { id: true, infinityPoints: true } } },
        }),
      ])
      const oldInfinity = existing?.infinityAwarded ?? 0
      const delta = newInfinity - oldInfinity
      const currentBalance = studentRow?.user?.infinityPoints ?? 0
      const userId = studentRow?.user?.id

      const res = await tx.testResult.upsert({
        where: {
          testId_studentId: { testId, studentId },
        },
        update: {
          correctAnswers: correct,
          infinityAwarded: newInfinity,
          notes: notes || null,
        },
        create: {
          testId,
          studentId,
          correctAnswers: correct,
          infinityAwarded: newInfinity,
          notes: notes || null,
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                },
              },
            },
          },
          test: {
            include: {
              group: {
                select: { id: true, name: true },
              },
            },
          },
        },
      })

      if (delta !== 0 && userId) {
        const balanceAfter = currentBalance + delta
        await tx.user.update({
          where: { id: userId },
          data: { infinityPoints: { increment: delta } },
        })
        await tx.infinityHistory.create({
          data: {
            userId,
            amount: delta,
            balanceAfter,
            source: 'TEST_RESULT',
            description: `Kunlik test ${percent}% → ${newInfinity} ∞`,
            referenceId: res.id,
          },
        })
      }

      return res
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error creating test result:', error)
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    )
  }
}

// GET - Get test results
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const testId = searchParams.get('testId')
    const studentId = searchParams.get('studentId')

    const where: any = {}
    if (testId) {
      where.testId = testId
    }
    if (studentId) {
      where.studentId = studentId
    }

    const results = await prisma.testResult.findMany({
      where,
      include: {
        test: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error fetching test results:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
