import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVazifaExamSettings } from '@/lib/vazifa-exam-settings'
import { expireOpenAttemptsForStudent } from '@/lib/vazifa-exam-expire'
import { shuffleArray } from '@/lib/shuffleArray'

export async function POST() {
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
    if (!settings.lockdownOpen) {
      return NextResponse.json({ error: 'Imtihon oynasi yopilgan' }, { status: 409 })
    }

    const allowed = await prisma.vazifaExamAllowedStudent.findUnique({
      where: { studentId: sid },
    })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Siz hozirgi navbat ro‘yxatida emassiz. Admin sizni qo‘shmaguncha kuting.' },
        { status: 403 }
      )
    }

    const existing = await prisma.vazifaExamAttempt.findFirst({
      where: { studentId: sid, endedAt: null },
    })
    if (existing) {
      let assigned409: { id: string; imageUrl: string }[] | null = null
      if (existing.assignedQuestions) {
        try {
          const p = JSON.parse(existing.assignedQuestions)
          if (Array.isArray(p) && p.length > 0) assigned409 = p
        } catch {
          assigned409 = null
        }
      }
      return NextResponse.json(
        {
          error: 'Davom etayotgan seans bor',
          activeAttempt: {
            id: existing.id,
            startedAt: existing.startedAt.toISOString(),
            deadlineAt: existing.deadlineAt.toISOString(),
            durationMinutes: existing.durationMinutes,
            assignedQuestions: assigned409,
          },
        },
        { status: 409 }
      )
    }

    const maxAttempts = Math.max(1, settings.maxAttempts || 1)
    const usedAttempts = await prisma.vazifaExamAttempt.count({
      where: { studentId: sid, endedAt: { not: null } },
    })
    if (usedAttempts >= maxAttempts) {
      return NextResponse.json(
        {
          error: `Urinishlar limiti tugagan (${usedAttempts}/${maxAttempts}). Admin bilan bog‘laning.`,
        },
        { status: 409 }
      )
    }

    const duration = Math.min(240, Math.max(1, settings.durationMinutes || 45))
    const startedAt = new Date()
    const deadlineAt = new Date(startedAt.getTime() + duration * 60_000)

    let assignedSnapshot: { id: string; imageUrl: string }[] | null = null
    if (settings.testBankTopicId && settings.examQuestionCount > 0) {
      const pool = await prisma.testBankOpenQuestion.findMany({
        where: { topicId: settings.testBankTopicId },
        select: { id: true, imageUrl: true },
      })
      if (pool.length === 0) {
        return NextResponse.json(
          { error: 'Admin tanlagan mavzuda savol yo‘q. Admin bilan bog‘laning.' },
          { status: 409 }
        )
      }
      const shuffled = shuffleArray(pool)
      const n = Math.min(settings.examQuestionCount, shuffled.length)
      assignedSnapshot = shuffled.slice(0, n)
    }

    const attempt = await prisma.vazifaExamAttempt.create({
      data: {
        studentId: sid,
        durationMinutes: duration,
        startedAt,
        deadlineAt,
        assignedQuestions: assignedSnapshot ? JSON.stringify(assignedSnapshot) : null,
      },
    })

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        startedAt: attempt.startedAt.toISOString(),
        deadlineAt: attempt.deadlineAt.toISOString(),
        durationMinutes: attempt.durationMinutes,
        assignedQuestions: assignedSnapshot,
      },
    })
  } catch (e) {
    console.error('student vazifa-exam/start POST', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
