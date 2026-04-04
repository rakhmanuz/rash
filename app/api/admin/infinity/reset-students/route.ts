import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, type PrismaTransactionClient } from '@/lib/prisma'
import { canMutateInfinityPoints } from '@/lib/natijalar-read-auth'

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
        ? (bodyUnknown as { userIds?: unknown; reason?: unknown })
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
    const actorLabel = actor.role === 'RAHBAR' ? 'Rahbar' : 'Admin'

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
          select: { id: true, role: true, infinityPoints: true },
        })

        if (!target) {
          summary.skippedNotFound += 1
          continue
        }
        if (target.role !== 'STUDENT') {
          summary.skippedNotStudent += 1
          continue
        }

        const current = target.infinityPoints ?? 0
        if (current === 0) {
          summary.skippedAlreadyZero += 1
          continue
        }

        await tx.user.update({
          where: { id: userId },
          data: { infinityPoints: 0 },
        })

        const description =
          reason ||
          `${actorLabel}: barcha ∞ nolga tushirildi (oldingi balans: ${current})`

        await tx.infinityHistory.create({
          data: {
            userId,
            amount: -current,
            balanceAfter: 0,
            source: 'ADMIN_RESET',
            description,
          },
        })

        summary.resetCount += 1
        summary.totalDeducted += current
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
