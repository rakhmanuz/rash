import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVazifaExamSettings } from '@/lib/vazifa-exam-settings'

function canManage(role: string | undefined) {
  return role === 'ADMIN' || role === 'MANAGER'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || !canManage(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const settings = await getVazifaExamSettings()
    let topicPartLabel: { partTitle: string; topicTitle: string } | null = null
    let testBankPartId: string | null = null
    if (settings.testBankTopicId) {
      const topic = await prisma.testBankTopic.findUnique({
        where: { id: settings.testBankTopicId },
        include: { part: { select: { title: true, sortOrder: true } } },
      })
      if (topic) {
        testBankPartId = topic.partId
        topicPartLabel = { partTitle: topic.part.title, topicTitle: topic.title }
      }
    }
    const allowedRows = await prisma.vazifaExamAllowedStudent.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        student: {
          include: {
            user: { select: { name: true, username: true } },
          },
        },
      },
    })

    const recentSubmissions = await prisma.vazifaExamSubmission.findMany({
      take: 80,
      orderBy: { submittedAt: 'desc' },
      include: {
        student: {
          include: {
            user: { select: { name: true, username: true } },
          },
        },
      },
    })

    return NextResponse.json({
      settings: { ...settings, topicPartLabel, testBankPartId },
      allowedStudents: allowedRows.map((r) => ({
        id: r.student.id,
        studentId: r.student.studentId,
        name: r.student.user.name,
        username: r.student.user.username,
        addedAt: r.createdAt.toISOString(),
      })),
      recentSubmissions,
    })
  } catch (e) {
    console.error('admin vazifa-exam GET', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || !canManage(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Yaroqsiz so‘rov' }, { status: 400 })
    }

    const data: {
      lockdownOpen?: boolean
      title?: string
      instructions?: string
      durationMinutes?: number
      testBankTopicId?: string | null
      examQuestionCount?: number
      maxAttempts?: number
    } = {}

    if (typeof body.lockdownOpen === 'boolean') {
      data.lockdownOpen = body.lockdownOpen
    }
    if (typeof body.title === 'string' && body.title.trim().length > 0) {
      data.title = body.title.trim().slice(0, 200)
    }
    if (typeof body.instructions === 'string') {
      data.instructions = body.instructions.slice(0, 8000)
    }
    if (typeof body.durationMinutes === 'number' && Number.isFinite(body.durationMinutes)) {
      const d = Math.round(body.durationMinutes)
      if (d >= 1 && d <= 240) {
        data.durationMinutes = d
      }
    }
    if (typeof body.maxAttempts === 'number' && Number.isFinite(body.maxAttempts)) {
      const m = Math.round(body.maxAttempts)
      if (m >= 1 && m <= 20) {
        data.maxAttempts = m
      }
    }

    if (typeof body.examQuestionCount === 'number' && Number.isFinite(body.examQuestionCount)) {
      const c = Math.round(body.examQuestionCount)
      if (c === 0) {
        data.examQuestionCount = 0
        data.testBankTopicId = null
      } else if (c >= 1 && c <= 50) {
        data.examQuestionCount = c
      }
    }

    if (body.testBankTopicId !== undefined) {
      if (body.testBankTopicId === null || body.testBankTopicId === '') {
        data.testBankTopicId = null
      } else if (typeof body.testBankTopicId === 'string') {
        const tid = body.testBankTopicId.trim()
        const topic = await prisma.testBankTopic.findUnique({ where: { id: tid } })
        if (!topic) {
          return NextResponse.json({ error: 'Mavzu topilmadi' }, { status: 400 })
        }
        data.testBankTopicId = tid
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Yangilanish yoq' }, { status: 400 })
    }

    const current = await getVazifaExamSettings()
    const mergedCount =
      data.examQuestionCount !== undefined ? data.examQuestionCount : current.examQuestionCount
    const mergedTopicId =
      data.testBankTopicId !== undefined ? data.testBankTopicId : current.testBankTopicId

    if (mergedCount > 0 && !mergedTopicId) {
      return NextResponse.json(
        { error: 'Savollar soni > 0 bo‘lsa, mavzu tanlanishi kerak' },
        { status: 400 }
      )
    }
    if (mergedCount > 0 && mergedTopicId) {
      const qn = await prisma.testBankOpenQuestion.count({ where: { topicId: mergedTopicId } })
      if (qn === 0) {
        return NextResponse.json({ error: 'Tanlangan mavzuda savol (rasm) yo‘q' }, { status: 400 })
      }
    }

    const settings = await prisma.vazifaExamSettings.update({
      where: { id: 'singleton' },
      data,
    })

    return NextResponse.json({ settings })
  } catch (e) {
    console.error('admin vazifa-exam PATCH', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
