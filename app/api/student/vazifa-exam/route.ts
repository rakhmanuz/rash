import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVazifaExamSettings } from '@/lib/vazifa-exam-settings'
import { expireOpenAttemptsForStudent } from '@/lib/vazifa-exam-expire'

const MAX_CONTENT = 120_000
const SUBMIT_GRACE_MS = 120_000

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { studentProfile: true },
    })

    if (!user?.studentProfile || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Faqat o‘quvchilar' }, { status: 403 })
    }

    const sid = user.studentProfile.id
    await expireOpenAttemptsForStudent(sid)

    const settings = await getVazifaExamSettings()
    const allowed = Boolean(
      await prisma.vazifaExamAllowedStudent.findUnique({ where: { studentId: sid } })
    )

    const active = await prisma.vazifaExamAttempt.findFirst({
      where: { studentId: sid, endedAt: null },
      orderBy: { startedAt: 'desc' },
    })

    return NextResponse.json({
      lockdownOpen: settings.lockdownOpen,
      title: settings.title,
      instructions: settings.instructions,
      durationMinutes: settings.durationMinutes,
      allowed,
      activeAttempt: active
        ? {
            id: active.id,
            startedAt: active.startedAt.toISOString(),
            deadlineAt: active.deadlineAt.toISOString(),
            durationMinutes: active.durationMinutes,
          }
        : null,
    })
  } catch (e) {
    console.error('student vazifa-exam GET', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { studentProfile: true },
    })

    if (!user?.studentProfile || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Faqat o‘quvchilar' }, { status: 403 })
    }

    const sid = user.studentProfile.id
    await expireOpenAttemptsForStudent(sid)

    const body = await request.json().catch(() => null)
    const attemptId = typeof body?.attemptId === 'string' ? body.attemptId : ''
    const closedByTimer = Boolean(body?.closedByTimer)

    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId kerak' }, { status: 400 })
    }

    const attempt = await prisma.vazifaExamAttempt.findFirst({
      where: { id: attemptId, studentId: sid },
    })
    if (!attempt) {
      return NextResponse.json({ error: 'Seans topilmadi' }, { status: 404 })
    }
    if (attempt.endedAt) {
      return NextResponse.json({ error: 'Seans allaqachon yopilgan' }, { status: 409 })
    }

    const now = Date.now()
    const deadlineMs = attempt.deadlineAt.getTime()
    if (now > deadlineMs + SUBMIT_GRACE_MS && !closedByTimer) {
      return NextResponse.json({ error: 'Muddati o‘tgan' }, { status: 409 })
    }

    let content = typeof body?.content === 'string' ? body.content : ''
    if (!content.trim()) {
      if (closedByTimer) {
        content =
          '[Tizim] Vaqt tugadi — o‘quvchi yubormagan qisqa yoki bo‘sh javob.'
      } else {
        return NextResponse.json({ error: 'Matn bo‘sh' }, { status: 400 })
      }
    }
    if (content.length > MAX_CONTENT) {
      return NextResponse.json({ error: 'Matn juda uzun' }, { status: 400 })
    }

    const endedAt = new Date()

    await prisma.$transaction([
      prisma.vazifaExamSubmission.create({
        data: {
          studentId: sid,
          content,
          startedAt: attempt.startedAt,
          attemptId: attempt.id,
          closedByTimer,
        },
      }),
      prisma.vazifaExamAttempt.update({
        where: { id: attempt.id },
        data: {
          endedAt,
          autoEnded: closedByTimer,
        },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('student vazifa-exam POST', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
