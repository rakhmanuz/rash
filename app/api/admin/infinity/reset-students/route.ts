import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, type PrismaTransactionClient } from '@/lib/prisma'
import { canMutateInfinityPoints } from '@/lib/natijalar-read-auth'
import {
  getAvailableForSubject,
  getStudentSubjectInfinityBreakdown,
} from '@/lib/subject-infinity'

let infinityHistoryHasSubjectIdCache: boolean | null = null

async function hasInfinityHistorySubjectId() {
  if (infinityHistoryHasSubjectIdCache !== null) return infinityHistoryHasSubjectIdCache
  try {
    const rows = (await prisma.$queryRawUnsafe(
      "PRAGMA table_info('InfinityHistory')"
    )) as Array<{ name?: string }>
    infinityHistoryHasSubjectIdCache = rows.some((r) => String(r?.name || '') === 'subjectId')
  } catch {
    infinityHistoryHasSubjectIdCache = false
  }
  return infinityHistoryHasSubjectIdCache
}

/**
 * POST — tanlangan o'quvchilarning joriy ∞ balansini 0 qiladi, har biri uchun InfinityHistory yozuvi yaratiladi.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const actor = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!actor || !canMutateInfinityPoints(actor.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const bodyUnknown: unknown = await request.json()
    const body =
      bodyUnknown && typeof bodyUnknown === 'object' && bodyUnknown !== null
        ? (bodyUnknown as { userIds?: unknown; reason?: unknown; subjectId?: unknown; subjectName?: unknown })
        : null
    const rawIds = body && Array.isArray(body.userIds) ? body.userIds : []
    const userIds: string[] = [
      ...new Set(
        rawIds
          .filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
          .map((id: string) => id.trim())
      ),
    ]

    if (userIds.length === 0) {
      return NextResponse.json({ error: 'Hech bo\'lmaganda bitta foydalanuvchi tanlang' }, { status: 400 })
    }

    const reason =
      body && typeof body.reason === 'string' ? body.reason.trim() : ''
    const subjectId =
      body && typeof body.subjectId === 'string' && body.subjectId.trim().length > 0
        ? body.subjectId.trim()
        : ''
    const subjectNameFromBody =
      body && typeof body.subjectName === 'string' && body.subjectName.trim().length > 0
        ? body.subjectName.trim()
        : ''
    const actorLabel = actor.role === 'RAHBAR' ? 'Rahbar' : 'Admin'
    const canWriteSubjectId = await hasInfinityHistorySubjectId()

    const summary = {
      resetCount: 0,
      skippedNotFound: 0,
      skippedNotStudent: 0,
      skippedAlreadyZero: 0,
      totalDeducted: 0,
    }

    await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      for (const userId of userIds) {
        const target = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true, infinityPoints: true, studentProfile: { select: { id: true } } },
        })

        if (!target) {
          summary.skippedNotFound += 1
          continue
        }
        if (target.role !== 'STUDENT') {
          summary.skippedNotStudent += 1
          continue
        }

        let deductAmount = target.infinityPoints ?? 0
        let subjectLabel = subjectNameFromBody || ''

        if (subjectId) {
          const studentId = target.studentProfile?.id
          if (!studentId) {
            summary.skippedNotFound += 1
            continue
          }
          const studentWithSubjects = await tx.student.findUnique({
            where: { id: studentId },
            select: {
              enrollments: {
                where: { isActive: true },
                select: {
                  group: { select: { subject: { select: { id: true, name: true } } } },
                },
              },
            },
          })
          const enrolledSubjects = new Map<string, string>()
          for (const enr of studentWithSubjects?.enrollments ?? []) {
            const sub = enr.group.subject
            if (sub?.id) enrolledSubjects.set(sub.id, sub.name)
          }
          if (!enrolledSubjects.has(subjectId)) {
            summary.skippedNotFound += 1
            continue
          }
          const breakdown = await getStudentSubjectInfinityBreakdown(prisma, {
            userId,
            studentId,
            enrolledSubjects,
            totalWallet: target.infinityPoints ?? 0,
          })
          deductAmount = getAvailableForSubject(breakdown, subjectId)
          subjectLabel = subjectLabel || enrolledSubjects.get(subjectId) || ''
        }

        if (deductAmount === 0) {
          summary.skippedAlreadyZero += 1
          continue
        }

        await tx.user.update({
          where: { id: userId },
          data: { infinityPoints: { decrement: deductAmount } },
        })

        const description =
          reason ||
          (subjectId
            ? `${actorLabel}: ${subjectLabel || 'tanlangan fan'} bo'yicha ∞ nolga tushirildi (ayirildi: ${deductAmount}) · fan: ${subjectLabel || subjectId}`
            : `${actorLabel}: barcha ∞ nolga tushirildi (oldingi balans: ${target.infinityPoints ?? 0})`)

        await tx.infinityHistory.create({
          data: canWriteSubjectId
            ? {
                userId,
                amount: -deductAmount,
                balanceAfter: Math.max(0, (target.infinityPoints ?? 0) - deductAmount),
                source: 'ADMIN_RESET',
                description,
                subjectId: subjectId || null,
              }
            : {
                userId,
                amount: -deductAmount,
                balanceAfter: Math.max(0, (target.infinityPoints ?? 0) - deductAmount),
                source: 'ADMIN_RESET',
                description,
              },
          select: { id: true },
        })

        summary.resetCount += 1
        summary.totalDeducted += deductAmount
      }
    })

    const parts: string[] = []
    if (summary.resetCount > 0) {
      parts.push(`${summary.resetCount} ta o'quvchi — jami ∞ ${summary.totalDeducted} nollandi`)
    }
    if (summary.skippedAlreadyZero > 0) {
      parts.push(`${summary.skippedAlreadyZero} tasi allaqachon 0 edi`)
    }
    if (summary.skippedNotStudent > 0) {
      parts.push(`${summary.skippedNotStudent} tasi o'quvchi emas (o'tkazib yuborildi)`)
    }
    if (summary.skippedNotFound > 0) {
      parts.push(`${summary.skippedNotFound} tasi topilmadi`)
    }

    return NextResponse.json({
      message: parts.length > 0 ? parts.join('. ') + '.' : 'Hech narsa o\'zgartirilmadi.',
      ...summary,
    })
  } catch (error) {
    console.error('Infinity reset-students error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
