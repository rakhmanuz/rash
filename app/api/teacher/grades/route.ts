import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get all grades for a teacher
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teacherProfile: true,
      },
    })

    if (!user || !user.teacherProfile) {
      return NextResponse.json([])
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const groupId = searchParams.get('groupId')

    const where: any = {
      teacherId: user.teacherProfile.id,
    }

    if (studentId) {
      where.studentId = studentId
    }

    if (groupId) {
      where.groupId = groupId
    }

    const grades = await prisma.grade.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(grades)
  } catch (error) {
    console.error('Error fetching grades:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// POST - Create new grade
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teacherProfile: {
          include: {
            groups: {
              where: { isActive: true },
            },
          },
        },
      },
    })

    if (!user || !user.teacherProfile) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { studentId, groupId, score, maxScore, type, notes } = body

    if (!studentId || !groupId || score === undefined) {
      return NextResponse.json(
        { error: 'O\'quvchi ID, guruh ID va ball kiritilishi kerak' },
        { status: 400 }
      )
    }

    // Verify teacher has access to this group
    const hasAccess = user.teacherProfile.groups.some(g => g.id === groupId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Guruhga kirish huquqi yo\'q' },
        { status: 403 }
      )
    }

    // Verify student is in the group
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_groupId: {
          studentId,
          groupId,
        },
      },
    })

    if (!enrollment || !enrollment.isActive) {
      return NextResponse.json(
        { error: 'O\'quvchi bu guruhda mavjud emas' },
        { status: 400 }
      )
    }

    // Check if grade already exists for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingGrade = await prisma.grade.findFirst({
      where: {
        studentId,
        groupId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    if (existingGrade) {
      return NextResponse.json(
        { error: 'Bugun bu o\'quvchi uchun ball allaqachon qo\'yilgan' },
        { status: 400 }
      )
    }

    // Create grade
    const grade = await prisma.grade.create({
      data: {
        studentId,
        teacherId: user.teacherProfile.id,
        groupId,
        score: parseFloat(score),
        maxScore: maxScore ? parseFloat(maxScore) : 100,
        type: type || 'test',
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
      },
    })

    return NextResponse.json(grade, { status: 201 })
  } catch (error) {
    console.error('Error creating grade:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
