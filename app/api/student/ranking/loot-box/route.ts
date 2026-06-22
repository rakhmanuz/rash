import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function rewardByTier(tier: 'common' | 'rare' | 'epic' | 'legendary') {
  if (tier === 'legendary') return 35
  if (tier === 'epic') return 24
  if (tier === 'rare') return 14
  return 6
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const dayStart = new Date(now)
    dayStart.setHours(0, 0, 0, 0)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        learningMode: true,
        infinityPoints: true,
        studentProfile: { select: { id: true, masteryLevel: true } },
      },
    })
    if (!user?.studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }
    const mode = user.learningMode === 'ONLINE' ? 'ONLINE' : 'OFFLINE'
    if (mode !== 'ONLINE') {
      return NextResponse.json({ error: 'Loot box faqat online o\'quvchilar uchun' }, { status: 403 })
    }

    const claimedToday = await prisma.infinityHistory.findFirst({
      where: {
        userId: user.id,
        source: 'RANKING_LOOT_BOX',
        createdAt: { gte: dayStart },
      },
      select: { id: true },
    })
    if (claimedToday) {
      return NextResponse.json({ error: 'Loot box already claimed today' }, { status: 400 })
    }

    const peers = await prisma.student.findMany({
      where: { user: { role: 'STUDENT', learningMode: mode } },
      select: { id: true },
      orderBy: [{ masteryLevel: 'desc' }, { id: 'asc' }],
    })
    const meRank = peers.findIndex((p) => p.id === user.studentProfile?.id) + 1
    const top20Reached = meRank > 0 && meRank <= 20
    const top10Reached = meRank > 0 && meRank <= 10
    const todayInfinity = await prisma.infinityHistory.aggregate({
      where: {
        userId: user.id,
        amount: { gt: 0 },
        createdAt: { gte: dayStart },
      },
      _sum: { amount: true },
    })
    const todayInfinityEarned = todayInfinity._sum.amount ?? 0
    const quests = [
      top20Reached,
      user.studentProfile.masteryLevel >= 80,
      todayInfinityEarned >= 12,
      top10Reached,
    ]
    const completedQuestCount = quests.filter(Boolean).length
    if (completedQuestCount < 2) {
      return NextResponse.json({ error: 'Not enough completed quests' }, { status: 400 })
    }

    const tier = completedQuestCount >= 4 ? 'legendary' : completedQuestCount >= 3 ? 'epic' : 'rare'
    const reward = rewardByTier(tier)
    const balanceAfter = user.infinityPoints + reward

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { infinityPoints: { increment: reward } },
      })
      await tx.infinityHistory.create({
        data: {
          userId: user.id,
          amount: reward,
          balanceAfter,
          source: 'RANKING_LOOT_BOX',
          description: `Daily loot box (${tier}) reward`,
        },
        select: { id: true },
      })
    })

    return NextResponse.json({ ok: true, tier, reward, balanceAfter })
  } catch (error) {
    console.error('Loot box claim error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

