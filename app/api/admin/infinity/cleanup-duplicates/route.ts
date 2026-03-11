import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST - Bir martalik: TEST_RESULT va WRITTEN_WORK_RESULT dublikatlarini tozalash.
 * Bir xil (userId, referenceId, amount, source) bo'lgan yozuvlardan bittasini qoldiradi,
 * qolganlarini o'chiradi va foydalanuvchi balansidan ortiqcha ballarni ayiradi.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const records = await prisma.infinityHistory.findMany({
      where: {
        source: { in: ['TEST_RESULT', 'WRITTEN_WORK_RESULT'] },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Guruhlash: avval referenceId bo'yicha, bo'lmasa (userId, amount, source, description, sana) bo'yicha
    const dateStr = (d: Date) => d.toISOString().slice(0, 10)
    const key = (r: { userId: string; referenceId: string | null; amount: number; source: string; description: string | null; createdAt: Date }) => {
      if (r.referenceId) return `ref:${r.userId}|${r.referenceId}|${r.amount}|${r.source}`
      return `desc:${r.userId}|${r.amount}|${r.source}|${r.description ?? ''}|${dateStr(r.createdAt)}`
    }
    const groups = new Map<string, typeof records>()
    for (const r of records) {
      const k = key(r)
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k)!.push(r)
    }

    const toDelete: string[] = []
    const userDecrement: Record<string, number> = {}

    for (const [, arr] of groups) {
      if (arr.length <= 1) continue
      // Birinchisini qoldiramiz, qolganlarini o'chiramiz
      const [keep, ...duplicates] = arr
      for (const dup of duplicates) {
        toDelete.push(dup.id)
        userDecrement[dup.userId] = (userDecrement[dup.userId] || 0) + dup.amount
      }
    }

    if (toDelete.length === 0) {
      return NextResponse.json({
        message: "Dublikat topilmadi. Hech narsa o'zgartirilmadi.",
        deleted: 0,
        usersAdjusted: 0,
      })
    }

    await prisma.$transaction(async (tx) => {
      await tx.infinityHistory.deleteMany({
        where: { id: { in: toDelete } },
      })
      for (const [userId, decrement] of Object.entries(userDecrement)) {
        const u = await tx.user.findUnique({
          where: { id: userId },
          select: { infinityPoints: true },
        })
        const current = u?.infinityPoints ?? 0
        const newPoints = Math.max(0, current - decrement)
        await tx.user.update({
          where: { id: userId },
          data: { infinityPoints: newPoints },
        })
      }
    })

    return NextResponse.json({
      message: `Dublikatlar tozalandi. ${toDelete.length} ta yozuv o'chirildi, ${Object.keys(userDecrement).length} ta foydalanuvchi balansi kamaytirildi.`,
      deleted: toDelete.length,
      usersAdjusted: Object.keys(userDecrement).length,
      details: userDecrement,
    })
  } catch (error) {
    console.error('Infinity cleanup-duplicates error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
