import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, type PrismaTransactionClient } from '@/lib/prisma'

/**
 * POST - Bir sana, bitta dars, bitta test uchun faqat BITTA infinity bo'lishi kerak.
 * Agar bir xil test natijasiga ikki marta yozilgan bo'lsa (masalan 16:51 va 17:04):
 * avtomatik oxirgisi (17:04) qoladi, oldingisi (16:51) olib tashlanadi.
 * Barcha o'zgarishlar (olingan ballar, ayirilgan dublikat) tarixga saqlanadi.
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
        referenceId: { not: null },
        amount: { gt: 0 },
      },
      select: {
        id: true,
        userId: true,
        referenceId: true,
        amount: true,
        source: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Guruhlash: (userId, referenceId, source) — bir xil natijaga bir necha marta qo'yilgan
    const key = (r: { userId: string; referenceId: string | null; source: string }) =>
      `${r.userId}|${r.referenceId}|${r.source}`

    const groups = new Map<string, typeof records>()
    for (const r of records) {
      const k = key(r)
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k)!.push(r)
    }

    const toDelete: string[] = []
    const userDecrement: Record<string, number> = {}

    for (const [, arr] of groups) {
      if (arr.length < 2) continue
      // Oxirgisi qoladi — oldingi dublikatlarni olib tashlash
      const earlier = arr.slice(0, -1)
      for (const r of earlier) {
        toDelete.push(r.id)
        userDecrement[r.userId] = (userDecrement[r.userId] || 0) + r.amount
      }
    }

    if (toDelete.length === 0) {
      return NextResponse.json({
        message:
          "Bir sana, bitta dars, bitta test uchun ortiqcha (dublikat) infinity topilmadi — hammasi to'g'ri.",
        deleted: 0,
        usersAdjusted: 0,
      })
    }

    await prisma.$transaction(async (tx: PrismaTransactionClient) => {
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
        // Tarixga yozish: dublikat olib tashlanganligi va oxirgisi qolgani
        await tx.infinityHistory.create({
          data: {
            userId,
            amount: -decrement,
            balanceAfter: newPoints,
            source: 'ADMIN_SUBTRACT',
            description: `Dublikat olib tashlandi: bir sana/dars/test uchun faqat bitta infinity qoladi (oldingi yozuv ayirildi, oxirgisi saqlandi).`,
          },
          select: { id: true },
        })
      }
    })

    return NextResponse.json({
      message: `Bajarildi: bir sana/dars/test uchun faqat oxirgi infinity qoldi, oldingi dublikatlar olib tashlandi. Barcha o'zgarishlar tarixga yozildi. ${toDelete.length} ta yozuv, ${Object.keys(userDecrement).length} ta foydalanuvchi.`,
      deleted: toDelete.length,
      usersAdjusted: Object.keys(userDecrement).length,
      details: userDecrement,
    })
  } catch (error) {
    console.error('Infinity cleanup-last-duplicate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
