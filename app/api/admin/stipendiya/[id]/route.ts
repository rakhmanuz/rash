import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isStipendProgramCode } from '@/lib/stipendiya'

function canManageStipendiya(role: string | undefined) {
  return role === 'ADMIN' || role === 'MANAGER'
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const existing = await prisma.studentStipendAward.findUnique({
      where: { id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
    }

    const body = await request.json()
    const program = body.program as string | undefined
    const examTitle =
      typeof body.examTitle === 'string' ? body.examTitle.trim() : undefined
    const examDateRaw = body.examDate as string | undefined
    const awardLabel =
      body.awardLabel === undefined
        ? undefined
        : typeof body.awardLabel === 'string' && body.awardLabel.trim()
          ? body.awardLabel.trim()
          : null
    const notes =
      body.notes === undefined
        ? undefined
        : typeof body.notes === 'string' && body.notes.trim()
          ? body.notes.trim()
          : null

    let scorePercent: number | null | undefined = undefined
    if (body.scorePercent !== undefined) {
      if (body.scorePercent === '' || body.scorePercent === null) {
        scorePercent = null
      } else {
        const n = Number(body.scorePercent)
        scorePercent = Number.isFinite(n) ? n : null
      }
    }

    if (program !== undefined && !isStipendProgramCode(program)) {
      return NextResponse.json({ error: 'Noto‘g‘ri stipendiya turi' }, { status: 400 })
    }

    let examDate: Date | undefined
    if (examDateRaw !== undefined) {
      examDate = new Date(examDateRaw)
      if (Number.isNaN(examDate.getTime())) {
        return NextResponse.json({ error: 'Sana noto‘g‘ri' }, { status: 400 })
      }
    }

    if (
      examTitle !== undefined &&
      !examTitle
    ) {
      return NextResponse.json(
        { error: 'Imtihon nomi bo‘sh bo‘lmasligi kerak' },
        { status: 400 }
      )
    }

    const updated = await prisma.studentStipendAward.update({
      where: { id },
      data: {
        ...(program !== undefined ? { program } : {}),
        ...(examTitle !== undefined ? { examTitle } : {}),
        ...(examDate !== undefined ? { examDate } : {}),
        ...(awardLabel !== undefined ? { awardLabel } : {}),
        ...(scorePercent !== undefined ? { scorePercent } : {}),
        ...(notes !== undefined ? { notes } : {}),
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

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating stipendiya:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const existing = await prisma.studentStipendAward.findUnique({
      where: { id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
    }

    await prisma.studentStipendAward.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting stipendiya:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
