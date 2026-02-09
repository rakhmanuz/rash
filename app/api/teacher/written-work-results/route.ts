import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Helper function to calculate score based on formula
function calculateWrittenWorkScore(
  correctAnswers: number,
  totalQuestions: number,
  remainingTime: number,
  timeGiven: number
): { score: number; masteryLevel: number } {
  const correctRatio = correctAnswers / totalQuestions

  let score: number
  if (remainingTime > 0) {
    // Vaqtdan oldin topshirilgan: (to'g'ri_javoblar_soni/jami_savol) * (1 + qolgan_vaqt/jami_vaqt) * (to'g'ri_javoblar_soni/jami_savol)
    score = correctRatio * (1 + remainingTime / timeGiven) * correctRatio
  } else {
    // Vaqtdan oldin topshirmagan: to'g'ri_javoblar_soni/jami_savol
    score = correctRatio
  }

  // Ensure score is between 0 and 1
  score = Math.max(0, Math.min(1, score))

  // Mastery level is score * 100 (percentage)
  const masteryLevel = score * 100

  return { score, masteryLevel }
}

// POST - Create or update written work result
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
    const { writtenWorkId, studentId, correctAnswers, remainingTime, notes } = body

    if (!writtenWorkId || !studentId || correctAnswers === undefined || remainingTime === undefined) {
      return NextResponse.json(
        { error: 'WrittenWorkId, studentId, correctAnswers va remainingTime kerak' },
        { status: 400 }
      )
    }

    // Check if written work belongs to teacher's group
    const writtenWork = await prisma.writtenWork.findUnique({
      where: { id: writtenWorkId },
      include: {
        group: true,
      },
    })

    if (!writtenWork) {
      return NextResponse.json({ error: 'Yozma ish topilmadi' }, { status: 404 })
    }

    const teacherGroupIds = user.teacherProfile.groups.map(g => g.id)
    if (!teacherGroupIds.includes(writtenWork.groupId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if correctAnswers is not greater than totalQuestions
    if (correctAnswers > writtenWork.totalQuestions) {
      return NextResponse.json(
        { error: `To'g'ri javoblar soni umumiy savollar sonidan ko'p bo'lishi mumkin emas` },
        { status: 400 }
      )
    }

    // Check if remainingTime is not greater than timeGiven
    if (remainingTime > writtenWork.timeGiven) {
      return NextResponse.json(
        { error: `Qolgan vaqt berilgan vaqtdan ko'p bo'lishi mumkin emas` },
        { status: 400 }
      )
    }

    // Calculate score and mastery level
    const { score, masteryLevel } = calculateWrittenWorkScore(
      parseInt(correctAnswers),
      writtenWork.totalQuestions,
      parseInt(remainingTime),
      writtenWork.timeGiven
    )

    // Upsert written work result
    const result = await prisma.writtenWorkResult.upsert({
      where: {
        writtenWorkId_studentId: {
          writtenWorkId,
          studentId,
        },
      },
      update: {
        correctAnswers: parseInt(correctAnswers),
        remainingTime: parseInt(remainingTime),
        score,
        masteryLevel,
        notes: notes || null,
      },
      create: {
        writtenWorkId,
        studentId,
        correctAnswers: parseInt(correctAnswers),
        remainingTime: parseInt(remainingTime),
        score,
        masteryLevel,
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
        writtenWork: {
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
    console.error('Error creating written work result:', error)
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    )
  }
}

// GET - Get written work results
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const writtenWorkId = searchParams.get('writtenWorkId')
    const studentId = searchParams.get('studentId')

    const where: any = {}
    if (writtenWorkId) {
      where.writtenWorkId = writtenWorkId
    }
    if (studentId) {
      where.studentId = studentId
    }

    const results = await prisma.writtenWorkResult.findMany({
      where,
      include: {
        writtenWork: {
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
    console.error('Error fetching written work results:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
