import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVazifaExamSettings } from '@/lib/vazifa-exam-settings'
import { expireOpenAttemptsForStudent } from '@/lib/vazifa-exam-expire'
import { checkOpenAnswer } from '@/lib/testBankOpenAnswer'
import { scoreBankSubmissionWithAI } from '@/lib/vazifa-exam-ai-score'

const MAX_CONTENT = 120_000
const SUBMIT_GRACE_MS = 120_000

function parseAiFromSubmission(content: string): { aiScore: number | null; aiFeedback: string } {
  try {
    const obj = JSON.parse(content) as {
      aiScore?: number
      aiFeedback?: string
      scoreLine?: string
    }
    const aiScore =
      typeof obj.aiScore === 'number' ? Math.max(0, Math.min(75, Math.round(obj.aiScore))) : null
    const aiFeedback =
      typeof obj.aiFeedback === 'string'
        ? obj.aiFeedback.trim()
        : typeof obj.scoreLine === 'string'
        ? obj.scoreLine.trim()
        : ''
    return { aiScore, aiFeedback }
  } catch {
    return { aiScore: null, aiFeedback: '' }
  }
}

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
    const usedAttempts = await prisma.vazifaExamAttempt.count({
      where: { studentId: sid, endedAt: { not: null } },
    })
    const maxAttempts = Math.max(1, settings.maxAttempts || 1)

    const active = await prisma.vazifaExamAttempt.findFirst({
      where: { studentId: sid, endedAt: null },
      orderBy: { startedAt: 'desc' },
    })
    const recentSubmissionsRaw = await prisma.vazifaExamSubmission.findMany({
      where: { studentId: sid },
      take: 12,
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        submittedAt: true,
        closedByTimer: true,
        content: true,
      },
    })
    const recentSubmissions = recentSubmissionsRaw.map((x) => {
      const ai = parseAiFromSubmission(x.content)
      return {
        id: x.id,
        submittedAt: x.submittedAt.toISOString(),
        closedByTimer: x.closedByTimer,
        aiScore: ai.aiScore,
        aiFeedback: ai.aiFeedback,
      }
    })

    let assignedParsed: { id: string; imageUrl: string }[] | null = null
    if (active?.assignedQuestions) {
      try {
        const p = JSON.parse(active.assignedQuestions)
        if (Array.isArray(p) && p.every((x) => x && typeof x.id === 'string' && typeof x.imageUrl === 'string')) {
          assignedParsed = p
        }
      } catch {
        assignedParsed = null
      }
    }

    return NextResponse.json({
      lockdownOpen: settings.lockdownOpen,
      title: settings.title,
      instructions: settings.instructions,
      durationMinutes: settings.durationMinutes,
      maxAttempts,
      usedAttempts,
      canStartMore: usedAttempts < maxAttempts,
      allowed,
      activeAttempt: active
        ? {
            id: active.id,
            startedAt: active.startedAt.toISOString(),
            deadlineAt: active.deadlineAt.toISOString(),
            durationMinutes: active.durationMinutes,
            assignedQuestions: assignedParsed,
          }
        : null,
      recentSubmissions,
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

    const existingSubmission = await prisma.vazifaExamSubmission.findUnique({
      where: { attemptId: attempt.id },
    })
    if (existingSubmission) {
      return NextResponse.json(
        {
          error:
            'Bu seans uchun javob allaqachon qabul qilingan. Har bir imtihon faqat bir marta topshiriladi.',
        },
        { status: 409 }
      )
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

    let assigned: { id: string; imageUrl: string }[] | null = null
    if (attempt.assignedQuestions) {
      try {
        const p = JSON.parse(attempt.assignedQuestions)
        if (Array.isArray(p) && p.length > 0 && p.every((x: unknown) => (x as { id?: string })?.id)) {
          assigned = p as { id: string; imageUrl: string }[]
        }
      } catch {
        assigned = null
      }
    }

    let aiScore: number | null = null
    let aiFeedback: string | null = null
    let aiMethod: string | null = null

    if (assigned && assigned.length > 0) {
      let parsed: {
        mode?: string
        items?: { questionId: string; answer?: string; approach?: string }[]
      }
      try {
        parsed = JSON.parse(content) as typeof parsed
      } catch {
        return NextResponse.json({ error: 'Javob formati noto‘g‘ri (JSON)' }, { status: 400 })
      }
      if (parsed?.mode !== 'bank' || !Array.isArray(parsed.items)) {
        return NextResponse.json({ error: 'Javob formati noto‘g‘ri' }, { status: 400 })
      }
      const allowedIds = new Set(assigned.map((x) => x.id))
      const byAnswer = new Map<string, string>()
      const byApproach = new Map<string, string>()
      for (const x of parsed.items) {
        if (!x || typeof x.questionId !== 'string') continue
        byAnswer.set(x.questionId, typeof x.answer === 'string' ? x.answer : '')
        byApproach.set(x.questionId, typeof x.approach === 'string' ? x.approach : '')
      }
      for (const [qid] of byAnswer) {
        if (!allowedIds.has(qid)) {
          return NextResponse.json({ error: 'Noto‘g‘ri savol identifikatori' }, { status: 400 })
        }
      }
      const mergedItems = assigned.map((q) => ({
        questionId: q.id,
        answer: String(byAnswer.get(q.id) ?? '').trim(),
        approach: String(byApproach.get(q.id) ?? '').trim(),
      }))
      if (!closedByTimer) {
        for (const it of mergedItems) {
          if (!it.answer) {
            return NextResponse.json({ error: 'Barcha savollarga javob yozing' }, { status: 400 })
          }
        }
      }
      let correctN = 0
      for (const it of mergedItems) {
        if (!it.answer) continue
        const row = await prisma.testBankOpenQuestion.findUnique({
          where: { id: it.questionId },
          select: { correctAnswer: true },
        })
        if (row && checkOpenAnswer(it.answer, row.correctAnswer)) correctN += 1
      }
      const scoreLine = `Avtomatik tekshiruv: ${correctN}/${assigned.length} to‘g‘ri`
      const out = {
        v: 1,
        mode: 'bank',
        items: mergedItems,
        scoreLine,
        aiScore: null as number | null,
        aiFeedback: null as string | null,
        aiMethod: null as string | null,
      }
      const enriched = mergedItems.map((it) => ({
        imageUrl: assigned.find((a) => a.id === it.questionId)?.imageUrl || '',
        answer: it.answer,
        approach: it.approach,
      }))
      const ai = await scoreBankSubmissionWithAI(enriched)
      const exactRatio = assigned.length > 0 ? correctN / assigned.length : 0
      const exactScore = Math.round(exactRatio * 35)
      const allCorrect = assigned.length > 0 && correctN === assigned.length
      const overallStatus = allCorrect ? 'To‘g‘ri' : 'Xato'
      if (ai) {
        // Qat'iy kombinatsiya: aniq javoblar 35%, izoh/usul sifati 40%.
        // Agar kamida bitta javob xato bo'lsa, izoh uchun maksimal 30% beriladi.
        const aiRaw = Math.max(0, Math.min(40, Math.round(ai.score)))
        const aiCap = allCorrect ? 40 : 30
        const aiPart = Math.min(aiRaw, aiCap)
        let finalScore = exactScore + aiPart
        if (correctN === 0) finalScore = Math.min(finalScore, 15)
        if (correctN === 1 && assigned.length >= 3) finalScore = Math.min(finalScore, 35)
        finalScore = Math.max(0, Math.min(75, finalScore))

        aiScore = finalScore
        aiFeedback = `${overallStatus}. ${ai.feedback} (Aniq javob: ${correctN}/${assigned.length}; Izoh: ${aiPart}%/${aiCap}%)`
        aiMethod = ai.solutionMethod || null
        out.aiScore = finalScore
        out.aiFeedback = aiFeedback
        out.aiMethod = aiMethod
      } else {
        // Faqat OpenAI baholash ishlatiladi.
        // AI javob bermasa, faqat aniq javob qismi qaytariladi.
        out.aiScore = exactScore
        out.aiFeedback = `${overallStatus}. OpenAI izoh tahlili yakunlanmadi (Aniq javob: ${correctN}/${assigned.length}).`
        out.aiMethod = null
        aiScore = exactScore
        aiFeedback = out.aiFeedback
        aiMethod = null
      }
      content = JSON.stringify(out)
    } else {
      let answerPart = content.trim()
      let approachPart = ''
      try {
        const j = JSON.parse(content) as { v?: number; answer?: string; approach?: string }
        if (j && typeof j === 'object' && j.v === 2 && typeof j.answer === 'string') {
          answerPart = j.answer.trim()
          approachPart = typeof j.approach === 'string' ? j.approach.trim() : ''
        }
      } catch {
        /* oddiy matn */
      }
      if (!answerPart) {
        if (closedByTimer) {
          const apOnly = approachPart.trim()
          content = apOnly.length
            ? JSON.stringify({ v: 2, answer: '', approach: apOnly })
            : '[Tizim] Vaqt tugadi — o‘quvchi yubormagan qisqa yoki bo‘sh javob.'
        } else {
          return NextResponse.json({ error: 'Matn bo‘sh' }, { status: 400 })
        }
      } else {
        const ap = approachPart.trim()
        content =
          ap.length > 0
            ? JSON.stringify({ v: 2, answer: answerPart, approach: ap })
            : answerPart
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

    return NextResponse.json({ ok: true, aiScore, aiFeedback, aiMethod })
  } catch (e) {
    console.error('student vazifa-exam POST', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
