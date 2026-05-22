import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeLearningMode, prismaStudentWhereForSameLearningMode } from '@/lib/learning-mode'

type RankedPeer = {
  id: string
  name: string
  username: string
  masteryLevel: number
  studentId: string
  school: string | null
  address: string | null
}

type ChampionshipWinner = {
  id: string
  name: string
  username: string
  score: number
  metric: 'infinity' | 'mastery'
}

type DailyQuest = {
  id: string
  title: string
  progress: number
  target: number
  rewardInfinity: number
  completed: boolean
}

function parseAddressTokens(address: string | null | undefined) {
  const raw = (address || '').trim()
  if (!raw) return { region: null as string | null, district: null as string | null, center: null as string | null }
  const parts = raw
    .split(/[,/\\\-]+/)
    .map((p) => p.trim())
    .filter(Boolean)
  return {
    region: parts[0] || null,
    district: parts[1] || null,
    center: parts[2] || null,
  }
}

function buildCategoryRanking(peers: RankedPeer[], key: 'school' | 'region' | 'district' | 'center') {
  const map = new Map<string, { total: number; count: number }>()
  for (const p of peers) {
    const tokens = parseAddressTokens(p.address)
    const label =
      key === 'school'
        ? (p.school || '').trim()
        : key === 'region'
          ? (tokens.region || '').trim()
          : key === 'district'
            ? (tokens.district || '').trim()
            : (tokens.center || '').trim()
    if (!label) continue
    const prev = map.get(label) || { total: 0, count: 0 }
    prev.total += p.masteryLevel
    prev.count += 1
    map.set(label, prev)
  }
  return Array.from(map.entries())
    .map(([name, stats]) => ({
      name,
      studentsCount: stats.count,
      avgMastery: stats.count > 0 ? Number((stats.total / stats.count).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.avgMastery - a.avgMastery || b.studentsCount - a.studentsCount || a.name.localeCompare(b.name))
    .slice(0, 10)
    .map((row, idx) => ({ ...row, rank: idx + 1 }))
}

async function resolveInfinityChampion({
  mode,
  startAt,
}: {
  mode: 'ONLINE' | 'OFFLINE'
  startAt: Date
}): Promise<ChampionshipWinner | null> {
  const rows = await prisma.infinityHistory.findMany({
    where: {
      createdAt: { gte: startAt },
      amount: { gt: 0 },
      user: { role: 'STUDENT', learningMode: mode },
    },
    select: {
      amount: true,
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
  })
  if (!rows.length) return null
  const totals = new Map<string, { name: string; username: string; total: number }>()
  for (const r of rows) {
    const prev = totals.get(r.user.id) || { name: r.user.name, username: r.user.username, total: 0 }
    prev.total += r.amount
    totals.set(r.user.id, prev)
  }
  let best: ChampionshipWinner | null = null
  for (const [id, val] of totals) {
    if (!best || val.total > best.score || (val.total === best.score && val.name.localeCompare(best.name) < 0)) {
      best = {
        id,
        name: val.name,
        username: val.username,
        score: val.total,
        metric: 'infinity',
      }
    }
  }
  return best
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestedMode = searchParams.get('mode')
    const normalizedRequestedMode =
      requestedMode === 'ONLINE' || requestedMode === 'OFFLINE' ? requestedMode : null

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        studentProfile: {
          include: {
            enrollments: {
              where: { isActive: true },
              include: {
                group: true,
              },
            },
          },
        },
      },
    })

    if (!user || !user.studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }
    if (
      normalizedRequestedMode &&
      (user.learningMode || 'OFFLINE') !== normalizedRequestedMode
    ) {
      return NextResponse.json({ error: 'Forbidden for this mode' }, { status: 403 })
    }

    const mode = normalizeLearningMode(user.learningMode)
    if (mode !== 'ONLINE') {
      return NextResponse.json({ error: 'Reyting faqat online o\'quvchilar uchun' }, { status: 403 })
    }

    const student = user.studentProfile
    const sameModeStudent = prismaStudentWhereForSameLearningMode(mode)

    // Get student's active groups
    const activeGroups = student.enrollments.map(e => e.groupId)

    // Guruh bo'yicha: faqat shu oqim (online yoki offline) o'quvchilari ichida reyting
    const groupRankings: any[] = []
    const currentStudentGroupRanks: Array<{ groupId: string; groupName: string; rank: number }> = []

    for (const groupId of activeGroups) {
      const groupEnrollments = await prisma.enrollment.findMany({
        where: {
          groupId,
          isActive: true,
          student: sameModeStudent,
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                },
              },
            },
          },
        },
      })

      const groupRows = groupEnrollments.map((e) => ({
        id: e.student.id,
        name: e.student.user.name,
        username: e.student.user.username,
        masteryLevel: e.student.masteryLevel,
        studentId: e.student.studentId,
      }))

      const sortedFull = [...groupRows].sort(
        (a, b) => b.masteryLevel - a.masteryLevel || a.id.localeCompare(b.id)
      )
      const myRankInGroup = sortedFull.findIndex((s) => s.id === student.id)

      const groupStudents = sortedFull.slice(0, 5).map((s, index) => ({
        ...s,
        rank: index + 1,
      }))

      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })

      if (group && myRankInGroup >= 0) {
        currentStudentGroupRanks.push({
          groupId: group.id,
          groupName: group.name,
          rank: myRankInGroup + 1,
        })
      }

      if (group && groupStudents.length > 0) {
        groupRankings.push({
          groupId: group.id,
          groupName: group.name,
          teacherName: group.teacher.user.name,
          students: groupStudents,
        })
      }
    }

    // Umumiy TOP: faqat shu oqimdagi barcha o'quvchilar orasidan
    const allStudents = await prisma.student.findMany({
      where: sameModeStudent,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: [{ masteryLevel: 'desc' }, { id: 'asc' }],
      take: 12,
    })

    const overallRankings = allStudents.map((s, index) => ({
      id: s.id,
      name: s.user.name,
      username: s.user.username,
      masteryLevel: s.masteryLevel,
      studentId: s.studentId,
      rank: index + 1,
    }))

    const allPeersOrdered = await prisma.student.findMany({
      where: sameModeStudent,
      select: { id: true },
      orderBy: [{ masteryLevel: 'desc' }, { id: 'asc' }],
    })
    const overallIdx = allPeersOrdered.findIndex((p) => p.id === student.id)
    const currentStudentOverallRanking = overallIdx >= 0 ? overallIdx + 1 : null

    const allPeersDetailed = await prisma.student.findMany({
      where: sameModeStudent,
      select: {
        id: true,
        studentId: true,
        masteryLevel: true,
        school: true,
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: [{ masteryLevel: 'desc' }, { id: 'asc' }],
    })
    const peers: RankedPeer[] = allPeersDetailed.map((s) => ({
      id: s.id,
      name: s.user.name,
      username: s.user.username,
      masteryLevel: s.masteryLevel,
      studentId: s.studentId,
      school: s.school,
      address: s.address,
    }))
    const categoryRankings = {
      university: buildCategoryRanking(peers, 'school'),
      region: buildCategoryRanking(peers, 'region'),
      district: buildCategoryRanking(peers, 'district'),
      center: buildCategoryRanking(peers, 'center'),
    }

    const now = new Date()
    const dayStart = new Date(now)
    dayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(now)
    monthStart.setMonth(monthStart.getMonth() - 1)
    const [dayChampion, weekChampion, monthChampion] = await Promise.all([
      resolveInfinityChampion({ mode, startAt: dayStart }),
      resolveInfinityChampion({ mode, startAt: weekStart }),
      resolveInfinityChampion({ mode, startAt: monthStart }),
    ])
    const absoluteChampionPeer = peers[0]
    const absoluteChampion: ChampionshipWinner | null = absoluteChampionPeer
      ? {
          id: absoluteChampionPeer.id,
          name: absoluteChampionPeer.name,
          username: absoluteChampionPeer.username,
          score: Number(absoluteChampionPeer.masteryLevel.toFixed(2)),
          metric: 'mastery',
        }
      : null

    const meIdx = peers.findIndex((p) => p.id === student.id)
    const mePeer = meIdx >= 0 ? peers[meIdx] : null
    const rivals = meIdx >= 0
      ? peers
          .filter((_, idx) => idx >= Math.max(0, meIdx - 2) && idx <= Math.min(peers.length - 1, meIdx + 2) && idx !== meIdx)
          .map((p, idx) => ({
            id: p.id,
            name: p.name,
            username: p.username,
            masteryLevel: p.masteryLevel,
            rank: peers.findIndex((x) => x.id === p.id) + 1,
            gapMastery: mePeer ? Number((p.masteryLevel - mePeer.masteryLevel).toFixed(2)) : 0,
          }))
      : []

    const topBoss = peers[0] || null
    const bossBattle = topBoss && mePeer
      ? {
          boss: {
            id: topBoss.id,
            name: topBoss.name,
            username: topBoss.username,
            rank: 1,
            masteryLevel: topBoss.masteryLevel,
          },
          myRank: meIdx + 1,
          stepsToBoss: Math.max(0, meIdx),
          masteryGap: Number(Math.max(0, topBoss.masteryLevel - mePeer.masteryLevel).toFixed(2)),
          isBossUnlocked: meIdx === 0,
        }
      : null

    const todayInfinity = await prisma.infinityHistory.aggregate({
      where: {
        userId: session.user.id,
        amount: { gt: 0 },
        createdAt: { gte: dayStart },
      },
      _sum: { amount: true },
    })
    const todayInfinityEarned = todayInfinity._sum.amount ?? 0
    const top20Reached = Boolean(currentStudentOverallRanking && currentStudentOverallRanking <= 20)
    const top10Reached = Boolean(currentStudentOverallRanking && currentStudentOverallRanking <= 10)
    const dailyQuests: DailyQuest[] = [
      {
        id: 'q-top20',
        title: 'TOP 20 ga kirish',
        progress: top20Reached ? 1 : 0,
        target: 1,
        rewardInfinity: 8,
        completed: top20Reached,
      },
      {
        id: 'q-mastery',
        title: 'Mastery 80% ga yetkazish',
        progress: Math.min(80, Math.round(student.masteryLevel)),
        target: 80,
        rewardInfinity: 10,
        completed: student.masteryLevel >= 80,
      },
      {
        id: 'q-infinity',
        title: "Bugun 12 ta Infinity to'plash",
        progress: Math.min(12, todayInfinityEarned),
        target: 12,
        rewardInfinity: 12,
        completed: todayInfinityEarned >= 12,
      },
      {
        id: 'q-top10',
        title: 'TOP 10 ni zabt etish',
        progress: top10Reached ? 1 : 0,
        target: 1,
        rewardInfinity: 15,
        completed: top10Reached,
      },
    ]
    const completedQuestCount = dailyQuests.filter((q) => q.completed).length
    const lootBox = {
      tier: completedQuestCount >= 4 ? 'legendary' : completedQuestCount >= 3 ? 'epic' : completedQuestCount >= 2 ? 'rare' : 'common',
      ready: completedQuestCount >= 2,
      claimedToday: false,
      completedQuestCount,
      totalQuestCount: dailyQuests.length,
      potentialRewardInfinity: completedQuestCount >= 4 ? 35 : completedQuestCount >= 3 ? 24 : completedQuestCount >= 2 ? 14 : 6,
    }
    const lootClaimedToday = await prisma.infinityHistory.findFirst({
      where: {
        userId: session.user.id,
        source: 'RANKING_LOOT_BOX',
        createdAt: { gte: dayStart },
      },
      select: { id: true },
    })
    if (lootClaimedToday) {
      lootBox.ready = false
      lootBox.claimedToday = true
    }

    return NextResponse.json({
      pool: mode,
      groupRankings,
      overallRankings,
      categoryRankings,
      championship: {
        day: dayChampion,
        week: weekChampion,
        month: monthChampion,
        absolute: absoluteChampion,
      },
      gameLoop: {
        dailyQuests,
        lootBox,
        rivals,
        bossBattle,
      },
      currentStudent: {
        id: student.id,
        overallRank: currentStudentOverallRanking,
        groupRanks: currentStudentGroupRanks,
        masteryLevel: student.masteryLevel,
      },
    })
  } catch (error) {
    console.error('Error fetching rankings:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
