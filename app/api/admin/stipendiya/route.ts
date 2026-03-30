import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isStipendProgramCode } from '@/lib/stipendiya'

function canManageStipendiya(role: string | undefined) {
  return role === 'ADMIN' || role === 'MANAGER'
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!admin || !canManageStipendiya(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const program = searchParams.get('program')
    const q = searchParams.get('q')?.trim()

    const awards = await prisma.studentStipendAward.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(program && isStipendProgramCode(program) ? { program } : {}),
        ...(q
          ? {
              student: {
                OR: [
                  { studentId: { contains: q } },
                  { user: { name: { contains: q } } },
                  { user: { username: { contains: q } } },
                ],
              },
            }
          : {}),
      },
      include: {
        student: {
          include: {
            user: {
              select: { id: true, name: true, username: true },
            },
          },
        },
        recordedBy: {
          select: { id: true, name: true, username: true },
        },
      },
      orderBy: [{ examDate: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(awards)
  } catch (error) {
    console.error('Error fetching admin stipendiya:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!admin || !canManageStipendiya(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const studentId = body.studentId as string | undefined
    const program = body.program as string | undefined
    const examTitle = (body.examTitle as string | undefined)?.trim()
    const examDateRaw = body.examDate as string | undefined
    const awardLabel =
      typeof body.awardLabel === 'string' && body.awardLabel.trim()
        ? body.awardLabel.trim()
        : null
    const notes =
      typeof body.notes === 'string' && body.notes.trim()
        ? body.notes.trim()
        : null

    let scorePercent: number | null = null
    if (body.scorePercent !== undefined && body.scorePercent !== '') {
      const n = Number(body.scorePercent)
      if (Number.isFinite(n)) scorePercent = n
    }

    if (!studentId || !program || !examTitle || !examDateRaw) {
      return NextResponse.json(
        { error: 'O‘quvchi, dastur, imtihon nomi va sanasi majburiy' },
        { status: 400 }
      )
    }

    if (!isStipendProgramCode(program)) {
      return NextResponse.json({ error: 'Noto‘g‘ri stipendiya turi' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    })
    if (!student) {
      return NextResponse.json({ error: 'O‘quvchi topilmadi' }, { status: 404 })
    }

    const examDate = new Date(examDateRaw)
    if (Number.isNaN(examDate.getTime())) {
      return NextResponse.json({ error: 'Sana noto‘g‘ri' }, { status: 400 })
    }

    const created = await prisma.studentStipendAward.create({
      data: {
        studentId,
        program,
        examTitle,
        examDate,
        awardLabel,
        scorePercent,
        notes,
        recordedById: admin.id,
      },
      include: {
        student: {
          include: {
            user: {
              select: { id: true, name: true, username: true },
            },
          },
        },
        recordedBy: {
          select: { id: true, name: true, username: true },
        },
      },
    })

    return NextResponse.json(created)
  } catch (error) {
    console.error('Error creating stipendiya:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
