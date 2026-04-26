import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isStipendProgramCode } from '@/lib/stipendiya'

function canManageStipendiya(role: string | undefined) {
  return role === 'ADMIN' || role === 'MANAGER'
}

function monthRangeFromYYYYMM(yyyyMm: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(yyyyMm)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null
  }
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
  return { start, end }
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
    const action = body.action as string | undefined

    if (action === 'zeroByProgram') {
      const program = body.program as string | undefined
      const month = body.month as string | undefined
      if (!program || !isStipendProgramCode(program)) {
        return NextResponse.json({ error: 'Noto‘g‘ri stipendiya turi' }, { status: 400 })
      }
      if (!month) {
        return NextResponse.json({ error: 'Oy majburiy' }, { status: 400 })
      }
      const range = monthRangeFromYYYYMM(month)
      if (!range) {
        return NextResponse.json({ error: 'Oy formati noto‘g‘ri' }, { status: 400 })
      }

      const updated = await prisma.studentStipendAward.updateMany({
        where: {
          program,
          examDate: {
            gte: range.start,
            lt: range.end,
          },
        },
        data: {
          amountUzs: 0,
          recordedById: admin.id,
        },
      })

      return NextResponse.json({
        ok: true,
        program,
        updatedCount: updated.count,
      })
    }

    const replaceExisting = body.replaceExisting === true
    const studentId = body.studentId as string | undefined
    const program = body.program as string | undefined
    let examTitle = (body.examTitle as string | undefined)?.trim()
    let examDateRaw = body.examDate as string | undefined
    const month = body.month as string | undefined
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

    let amountUzs: number | null = null
    if (body.amountUzs !== undefined && body.amountUzs !== '' && body.amountUzs !== null) {
      const n = Number(body.amountUzs)
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ error: 'Summa noto‘g‘ri' }, { status: 400 })
      }
      amountUzs = Math.round(n)
    }

    if (replaceExisting) {
      if (!studentId || !program) {
        return NextResponse.json(
          { error: 'O‘quvchi va stipendiya turi majburiy' },
          { status: 400 }
        )
      }
      if (amountUzs === null) {
        return NextResponse.json(
          { error: 'Stipendiya summasini kiriting' },
          { status: 400 }
        )
      }
      if (!examTitle) examTitle = 'Stipendiya'
      if (month) examDateRaw = `${month}-01`
      if (!examDateRaw) examDateRaw = new Date().toISOString().slice(0, 10)
    } else {
      if (!studentId || !program || !examTitle || !examDateRaw) {
        return NextResponse.json(
          { error: 'O‘quvchi, dastur, imtihon nomi va sanasi majburiy' },
          { status: 400 }
        )
      }
    }

    if (!program || !isStipendProgramCode(program)) {
      return NextResponse.json({ error: 'Noto‘g‘ri stipendiya turi' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    })
    if (!student) {
      return NextResponse.json({ error: 'O‘quvchi topilmadi' }, { status: 404 })
    }

    const examDate = new Date(examDateRaw!)
    if (Number.isNaN(examDate.getTime())) {
      return NextResponse.json({ error: 'Sana noto‘g‘ri' }, { status: 400 })
    }

    if (replaceExisting) {
      const ym = examDateRaw!.slice(0, 7)
      const range = monthRangeFromYYYYMM(ym)
      if (!range) {
        return NextResponse.json({ error: 'Oy formati noto‘g‘ri' }, { status: 400 })
      }
      await prisma.studentStipendAward.deleteMany({
        where: {
          studentId,
          examDate: {
            gte: range.start,
            lt: range.end,
          },
        },
      })
    }

    const created = await prisma.studentStipendAward.create({
      data: {
        studentId,
        program,
        examTitle: examTitle!,
        examDate,
        amountUzs,
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
