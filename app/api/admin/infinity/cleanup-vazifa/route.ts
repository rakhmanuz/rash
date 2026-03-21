import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST - Bir martalik: uyga vazifa (type=uyga_vazifa) uchun noto'g'ri berilgan
 * infinity ballarni olib tashlash. TestResult.infinityAwarded ni 0 qiladi va
 * foydalanuvchi balansidan shu miqdorni ayiradi.
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

    const vazifaResults = await prisma.testResult.findMany({
      where: {
        test: { type: 'uyga_vazifa' },
        infinityAwarded: { gt: 0 },
      },
      include: {
        test: { select: { id: true, type: true, date: true } },
        student: { select: { userId: true } },
      },
    })

    if (vazifaResults.length === 0) {
      return NextResponse.json({
        message: "Uyga vazifa uchun berilgan infinity topilmadi. Hech narsa o'zgartirilmadi.",
        corrected: 0,
        totalRemoved: 0,
        usersAdjusted: 0,
      })
    }

    let totalRemoved = 0
    const usersAdjusted = new Set<string>()

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const tr of vazifaResults) {
        const userId = tr.student.userId
        const amount = tr.infinityAwarded

        const u = await tx.user.findUnique({
          where: { id: userId },
          select: { infinityPoints: true },
        })
        const current = u?.infinityPoints ?? 0
        const newPoints = Math.max(0, current - amount)

        await tx.user.update({
          where: { id: userId },
          data: { infinityPoints: newPoints },
        })
        await tx.testResult.update({
          where: { id: tr.id },
          data: { infinityAwarded: 0 },
        })
        await tx.infinityHistory.create({
          data: {
            userId,
            amount: -amount,
            balanceAfter: newPoints,
            source: 'ADMIN_SUBTRACT',
            description: `Tuzatish: uyga vazifa uchun berilgan ∞ ${amount} olib tashlandi`,
            referenceId: tr.id,
          },
        })

        totalRemoved += amount
        usersAdjusted.add(userId)
      }
    })

    return NextResponse.json({
      message: `Uyga vazifa infinitylari tozalandi. ${vazifaResults.length} ta natija, jami ∞ ${totalRemoved} olib tashlandi, ${usersAdjusted.size} ta foydalanuvchi.`,
      corrected: vazifaResults.length,
      totalRemoved,
      usersAdjusted: usersAdjusted.size,
    })
  } catch (error) {
    console.error('Infinity cleanup-vazifa error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
