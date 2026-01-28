import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    // Upsert test result
    const result = await prisma.testResult.upsert({
      where: {
        testId_studentId: {
          testId,
          studentId,
        },
      },
      update: {
        correctAnswers: parseInt(correctAnswers),
        notes: notes || null,
      },
      create: {
        testId,
        studentId,
        correctAnswers: parseInt(correctAnswers),
        notes: notes || null,
      },
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
      },
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
