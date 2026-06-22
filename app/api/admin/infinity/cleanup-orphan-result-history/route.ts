import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, type PrismaTransactionClient } from '@/lib/prisma'

type CandidateRow = {
  id: string
  userId: string
  amount: number
  source: string
  referenceId: string | null
}

/**
 * POST - Eski o'chirilgan test/yozma ish natijalari uchun qolib ketgan
 * InfinityHistory yozuvlarini tozalaydi va user.infinityPoints ni moslaydi.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const actor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })
    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const candidates = await prisma.infinityHistory.findMany({
      where: {
        source: { in: ['TEST_RESULT', 'WRITTEN_WORK_RESULT'] },
        referenceId: { not: null },
      },
      select: {
        id: true,
        userId: true,
        amount: true,
        source: true,
        referenceId: true,
      },
    })

    if (candidates.length === 0) {
      return NextResponse.json({
        message: "Tozalanadigan result-history topilmadi.",
        deletedHistoryRows: 0,
        adjustedUsers: 0,
        netRemovedInfinity: 0,
      })
    }

    const testResultIds = new Set<string>()
    const writtenWorkResultIds = new Set<string>()
    for (const row of candidates) {
      if (!row.referenceId) continue
      if (row.source === 'TEST_RESULT') testResultIds.add(row.referenceId)
      if (row.source === 'WRITTEN_WORK_RESULT') writtenWorkResultIds.add(row.referenceId)
    }

    const [existingTestResults, existingWrittenResults] = await Promise.all([
      testResultIds.size > 0
        ? prisma.testResult.findMany({
            where: { id: { in: [...testResultIds] } },
            select: { id: true },
          })
        : Promise.resolve([]),
      writtenWorkResultIds.size > 0
        ? prisma.writtenWorkResult.findMany({
            where: { id: { in: [...writtenWorkResultIds] } },
            select: { id: true },
          })
        : Promise.resolve([]),
    ])

    const existingTestIdSet = new Set(existingTestResults.map((r) => r.id))
    const existingWrittenIdSet = new Set(existingWrittenResults.map((r) => r.id))

    const orphanRows: CandidateRow[] = candidates.filter((row) => {
      if (!row.referenceId) return false
      if (row.source === 'TEST_RESULT') return !existingTestIdSet.has(row.referenceId)
      if (row.source === 'WRITTEN_WORK_RESULT') return !existingWrittenIdSet.has(row.referenceId)
      return false
    })

    if (orphanRows.length === 0) {
      return NextResponse.json({
        message: "Orphan result-history topilmadi. Hammasi toza.",
        deletedHistoryRows: 0,
        adjustedUsers: 0,
        netRemovedInfinity: 0,
      })
    }

    const deltaByUserId = new Map<string, number>()
    for (const row of orphanRows) {
      const prev = deltaByUserId.get(row.userId) ?? 0
      deltaByUserId.set(row.userId, prev + row.amount)
    }

    await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      for (const [userId, orphanNetAmount] of deltaByUserId.entries()) {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { infinityPoints: true },
        })

        const current = user?.infinityPoints ?? 0
        const next = Math.max(0, current - orphanNetAmount)
        await tx.user.update({
          where: { id: userId },
          data: { infinityPoints: next },
        })
      }

      await tx.infinityHistory.deleteMany({
        where: {
          id: { in: orphanRows.map((r) => r.id) },
        },
      })
    })

    const netRemovedInfinity = [...deltaByUserId.values()].reduce((sum, v) => sum + v, 0)

    return NextResponse.json({
      message: `Tozalash yakunlandi: ${orphanRows.length} ta orphan history o'chirildi, ${deltaByUserId.size} ta user balansi moslandi.`,
      deletedHistoryRows: orphanRows.length,
      adjustedUsers: deltaByUserId.size,
      netRemovedInfinity,
    })
  } catch (error) {
    console.error('cleanup-orphan-result-history error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
