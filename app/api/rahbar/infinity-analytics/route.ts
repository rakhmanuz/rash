import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

const SOURCE_LABELS: Record<string, string> = {
  TEST_RESULT: 'Kunlik test',
  WRITTEN_WORK_RESULT: 'Yozma ish',
  ADMIN_ADD: 'Admin qo‘shdi',
  ADMIN_SUBTRACT: 'Admin ayirdi',
  MARKET_ORDER: 'Market xaridi',
}

const ALLOWED_SOURCES = new Set(['', 'TEST_RESULT', 'WRITTEN_WORK_RESULT', 'ADMIN_ADD', 'ADMIN_SUBTRACT'])

function tashkentYmd(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Tashkent' })
}

function parseWindow(request: NextRequest): {
  windowStart: Date
  windowEnd: Date
  daysParam: number
  groupId: string | undefined
  sourceFilter: string
  dateFrom: string | null
  dateTo: string | null
} {
  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('dateFrom')?.trim() || null
  const dateTo = searchParams.get('dateTo')?.trim() || null
  let daysParam = Math.min(Math.max(parseInt(searchParams.get('days') || '90', 10), 7), 365)
  const groupId = searchParams.get('groupId')?.trim() || undefined
  let sourceFilter = searchParams.get('source')?.trim() || ''
  if (!ALLOWED_SOURCES.has(sourceFilter)) sourceFilter = ''

  const now = new Date()
  let windowEnd = new Date(now)
  windowEnd.setHours(23, 59, 59, 999)

  let windowStart: Date
  if (dateFrom && dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    windowStart = new Date(`${dateFrom}T00:00:00.000`)
    windowEnd = new Date(`${dateTo}T23:59:59.999`)
    const diff = Math.ceil((windowEnd.getTime() - windowStart.getTime()) / (24 * 60 * 60 * 1000))
    daysParam = Math.min(Math.max(diff, 1), 366)
  } else {
    windowStart = new Date(windowEnd)
    windowStart.setDate(windowStart.getDate() - daysParam)
    windowStart.setHours(0, 0, 0, 0)
  }

  return { windowStart, windowEnd, daysParam, groupId, sourceFilter, dateFrom, dateTo }
}

function historyWhere(
  from: Date,
  to: Date,
  source: string,
  userIds: string[] | null,
): Prisma.InfinityHistoryWhereInput {
  const w: Prisma.InfinityHistoryWhereInput = {
    createdAt: { gte: from, lte: to },
    amount: { gt: 0 },
  }
  if (source) w.source = source
  if (userIds && userIds.length > 0) w.userId = { in: userIds }
  return w
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const me = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!me || me.role !== 'RAHBAR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { windowStart, windowEnd, daysParam, groupId, sourceFilter, dateFrom, dateTo } = parseWindow(request)
    const windowMs = Math.max(1, windowEnd.getTime() - windowStart.getTime())
    const priorEnd = new Date(windowStart.getTime() - 1)
    priorEnd.setHours(23, 59, 59, 999)
    const priorStart = new Date(priorEnd.getTime() - windowMs)
    priorStart.setHours(0, 0, 0, 0)

    let allowedUserIds: string[] | null = null
    if (groupId) {
      const studs = await prisma.student.findMany({
        where: { enrollments: { some: { groupId, isActive: true } } },
        select: { userId: true },
      })
      allowedUserIds = studs.map((s) => s.userId)
    }

    const hw = historyWhere(windowStart, windowEnd, sourceFilter, allowedUserIds)
    const hwPrior = historyWhere(priorStart, priorEnd, sourceFilter, allowedUserIds)

    const testWhere: Prisma.TestResultWhereInput = {
      createdAt: { gte: windowStart, lte: windowEnd },
      infinityAwarded: { gt: 0 },
      test: groupId ? { groupId } : undefined,
    }
    const writtenWhere: Prisma.WrittenWorkResultWhereInput = {
      createdAt: { gte: windowStart, lte: windowEnd },
      infinityAwarded: { gt: 0 },
      writtenWork: groupId ? { groupId } : undefined,
    }

    const skipTests = sourceFilter === 'WRITTEN_WORK_RESULT' || sourceFilter === 'ADMIN_ADD'
    const skipWritten = sourceFilter === 'TEST_RESULT' || sourceFilter === 'ADMIN_ADD'

    const [
      groupsWithEnrollments,
      enrollmentsForMap,
      historyWindow,
      priorAgg,
      bySourceWindow,
      historyAllSources,
      topRows,
      recentRows,
    ] = await Promise.all([
      prisma.group.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          enrollments: {
            where: { isActive: true },
            select: {
              student: {
                select: {
                  userId: true,
                  user: { select: { infinityPoints: true } },
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.enrollment.findMany({
        where: { isActive: true },
        select: {
          student: { select: { userId: true } },
          group: { select: { id: true, name: true } },
        },
        orderBy: { id: 'asc' },
      }),
      prisma.infinityHistory.findMany({
        where: hw,
        select: {
          id: true,
          userId: true,
          amount: true,
          source: true,
          description: true,
          createdAt: true,
        },
      }),
      prisma.infinityHistory.aggregate({
        where: hwPrior,
        _sum: { amount: true },
      }),
      prisma.infinityHistory.groupBy({
        by: ['source'],
        where: hw,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.infinityHistory.groupBy({
        by: ['source'],
        where: { amount: { gt: 0 } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.infinityHistory.findMany({
        where: hw,
        orderBy: { amount: 'desc' },
        take: 20,
        select: {
          id: true,
          userId: true,
          amount: true,
          source: true,
          description: true,
          createdAt: true,
        },
      }),
      prisma.infinityHistory.findMany({
        where: hw,
        orderBy: { createdAt: 'desc' },
        take: 60,
        select: {
          id: true,
          userId: true,
          amount: true,
          source: true,
          description: true,
          createdAt: true,
        },
      }),
    ])

    const testResults = skipTests
      ? []
      : await prisma.testResult.findMany({
          where: testWhere,
          select: {
            infinityAwarded: true,
            test: {
              select: {
                id: true,
                title: true,
                type: true,
                group: { select: { id: true, name: true } },
              },
            },
          },
        })
    const writtenResults = skipWritten
      ? []
      : await prisma.writtenWorkResult.findMany({
          where: writtenWhere,
          select: {
            infinityAwarded: true,
            writtenWork: {
              select: {
                id: true,
                title: true,
                group: { select: { id: true, name: true } },
              },
            },
          },
        })

    const userToGroup = new Map<string, { id: string; name: string }>()
    for (const e of enrollmentsForMap) {
      const uid = e.student.userId
      if (!userToGroup.has(uid)) {
        userToGroup.set(uid, { id: e.group.id, name: e.group.name })
      }
    }

    type GStat = {
      groupId: string
      groupName: string
      studentCount: number
      totalBalance: number
      earnedWindow: number
      txWindow: number
      testEvents: number
      writtenEvents: number
      testInfinitySum: number
      writtenInfinitySum: number
    }

    const groupStats = new Map<string, GStat>()
    for (const g of groupsWithEnrollments) {
      let totalBalance = 0
      let studentCount = 0
      for (const en of g.enrollments) {
        studentCount++
        totalBalance += en.student.user.infinityPoints ?? 0
      }
      groupStats.set(g.id, {
        groupId: g.id,
        groupName: g.name,
        studentCount,
        totalBalance,
        earnedWindow: 0,
        txWindow: 0,
        testEvents: 0,
        writtenEvents: 0,
        testInfinitySum: 0,
        writtenInfinitySum: 0,
      })
    }

    const nonStudent = {
      label: 'Boshqa (o‘qituvchi / admin / guruhdan tashqari)',
      earnedWindow: 0,
      txWindow: 0,
    }

    const hourlyEarned = new Array(24).fill(0)
    const weekdayEarned = new Array(7).fill(0)
    const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

    type DayAgg = { date: string; earned: number; count: number; bySource: Record<string, number> }
    const byDay = new Map<string, DayAgg>()

    const historyWindowFiltered =
      allowedUserIds && allowedUserIds.length === 0 ? [] : historyWindow

    for (const h of historyWindowFiltered) {
      const day = tashkentYmd(new Date(h.createdAt))
      const g = userToGroup.get(h.userId)

      if (g) {
        const gs = groupStats.get(g.id)
        if (gs) {
          gs.earnedWindow += h.amount
          gs.txWindow += 1
        }
      } else {
        nonStudent.earnedWindow += h.amount
        nonStudent.txWindow += 1
      }

      let d = byDay.get(day)
      if (!d) {
        d = { date: day, earned: 0, count: 0, bySource: {} }
        byDay.set(day, d)
      }
      d.earned += h.amount
      d.count += 1
      d.bySource[h.source] = (d.bySource[h.source] || 0) + h.amount

      const hp = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Tashkent',
        hour: 'numeric',
        hour12: false,
      }).formatToParts(new Date(h.createdAt))
      const hv = parseInt(hp.find((p) => p.type === 'hour')?.value ?? '0', 10)
      const hour = Number.isFinite(hv) ? hv % 24 : 0
      hourlyEarned[hour] += h.amount

      const wd = new Date(h.createdAt).toLocaleDateString('en-US', {
        timeZone: 'Asia/Tashkent',
        weekday: 'short',
      })
      const wi = wdMap[wd]
      if (wi !== undefined) weekdayEarned[wi] += h.amount
    }

    for (const r of testResults) {
      const gid = r.test.group.id
      const gs = groupStats.get(gid)
      if (gs) {
        gs.testEvents += 1
        gs.testInfinitySum += r.infinityAwarded
      }
    }
    for (const r of writtenResults) {
      const gid = r.writtenWork.group.id
      const gs = groupStats.get(gid)
      if (gs) {
        gs.writtenEvents += 1
        gs.writtenInfinitySum += r.infinityAwarded
      }
    }

    let peakHourEarned = { hour: 0, total: 0 }
    hourlyEarned.forEach((t: number, hour: number) => {
      if (t > peakHourEarned.total) peakHourEarned = { hour, total: t }
    })

    const weekdayLabels = ['Yak', 'Du', 'Se', 'Cho', 'Pay', 'Ju', 'Sha']
    const byWeekday = weekdayLabels.map((label, i) => ({
      label,
      earned: weekdayEarned[i] || 0,
    }))

    const dailySorted = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date))
    const now = new Date()
    const endYmd = tashkentYmd(now)
    const from30 = new Date(now)
    from30.setDate(from30.getDate() - 30)
    const start30Ymd = tashkentYmd(from30)
    const last30Days = dailySorted.filter((d) => d.date >= start30Ymd && d.date <= endYmd)

    let peakEarnedDay: { date: string; earned: number; count: number } | null = null
    for (const d of dailySorted) {
      if (!peakEarnedDay || d.earned > peakEarnedDay.earned) {
        peakEarnedDay = { date: d.date, earned: d.earned, count: d.count }
      }
    }
    let peakEarned30: { date: string; earned: number } | null = null
    for (const d of last30Days) {
      if (!peakEarned30 || d.earned > peakEarned30.earned) {
        peakEarned30 = { date: d.date, earned: d.earned }
      }
    }

    const bySourceWindowMapped = bySourceWindow.map((x) => ({
      source: x.source,
      label: SOURCE_LABELS[x.source] || x.source,
      totalAmount: x._sum.amount ?? 0,
      count: x._count,
    }))

    const bySourceAll = historyAllSources.map((x) => ({
      source: x.source,
      label: SOURCE_LABELS[x.source] || x.source,
      totalAmount: x._sum.amount ?? 0,
      count: x._count,
    }))

    const totalStudentBalance = [...groupStats.values()].reduce((s, g) => s + g.totalBalance, 0)
    const totalStudentsInGroups = [...groupStats.values()].reduce((s, g) => s + g.studentCount, 0)

    const earnedWindowTotal = historyWindowFiltered.reduce((s, h) => s + h.amount, 0)
    const earnedPriorTotal = priorAgg._sum.amount ?? 0

    const testMap = new Map<
      string,
      {
        testId: string
        title: string
        type: string
        groupId: string
        groupName: string
        resultCount: number
        totalInfinity: number
      }
    >()
    for (const r of testResults) {
      const t = r.test
      const cur = testMap.get(t.id) || {
        testId: t.id,
        title: (t.title && t.title.trim()) || 'Nomsiz test',
        type: t.type,
        groupId: t.group.id,
        groupName: t.group.name,
        resultCount: 0,
        totalInfinity: 0,
      }
      cur.resultCount += 1
      cur.totalInfinity += r.infinityAwarded
      testMap.set(t.id, cur)
    }
    const topTests = [...testMap.values()]
      .sort((a, b) => b.resultCount - a.resultCount || b.totalInfinity - a.totalInfinity)
      .slice(0, 30)

    const writtenMap = new Map<
      string,
      {
        writtenWorkId: string
        title: string
        groupId: string
        groupName: string
        resultCount: number
        totalInfinity: number
      }
    >()
    for (const r of writtenResults) {
      const w = r.writtenWork
      const cur = writtenMap.get(w.id) || {
        writtenWorkId: w.id,
        title: (w.title && w.title.trim()) || 'Nomsiz yozma ish',
        groupId: w.group.id,
        groupName: w.group.name,
        resultCount: 0,
        totalInfinity: 0,
      }
      cur.resultCount += 1
      cur.totalInfinity += r.infinityAwarded
      writtenMap.set(w.id, cur)
    }
    const topWrittenWorks = [...writtenMap.values()]
      .sort((a, b) => b.resultCount - a.resultCount || b.totalInfinity - a.totalInfinity)
      .slice(0, 25)

    const byGroupList = [...groupStats.values()]
      .map((g) => {
        const testsInGroup = [...testMap.values()].filter((t) => t.groupId === g.groupId)
        testsInGroup.sort((a, b) => b.resultCount - a.resultCount)
        const topTestInGroup = testsInGroup[0]
        const writtenInGroup = [...writtenMap.values()].filter((w) => w.groupId === g.groupId)
        writtenInGroup.sort((a, b) => b.resultCount - a.resultCount)
        const topWrittenInGroup = writtenInGroup[0]
        return {
          ...g,
          averageBalance: g.studentCount > 0 ? Math.round(g.totalBalance / g.studentCount) : 0,
          avgEarnedPerStudentWindow:
            g.studentCount > 0 ? Math.round(g.earnedWindow / g.studentCount) : 0,
          topTestLabel: topTestInGroup
            ? `${topTestInGroup.title} (${topTestInGroup.resultCount} natija)`
            : null,
          topWrittenLabel: topWrittenInGroup
            ? `${topWrittenInGroup.title} (${topWrittenInGroup.resultCount} natija)`
            : null,
        }
      })
      .sort((a, b) => b.totalBalance - a.totalBalance)

    const userDayCounts = new Map<string, Map<string, number>>()
    for (const h of historyWindowFiltered) {
      const day = tashkentYmd(new Date(h.createdAt))
      if (!userDayCounts.has(h.userId)) userDayCounts.set(h.userId, new Map())
      const m = userDayCounts.get(h.userId)!
      m.set(day, (m.get(day) || 0) + 1)
    }
    const highFrequency: { userId: string; day: string; count: number }[] = []
    for (const [uid, dm] of userDayCounts) {
      for (const [day, c] of dm) {
        if (c >= 8) highFrequency.push({ userId: uid, day, count: c })
      }
    }
    highFrequency.sort((a, b) => b.count - a.count)
    const highFrequencyTop = highFrequency.slice(0, 15)

    const weirdFlags = historyWindowFiltered.filter(
      (h) =>
        (h.source === 'TEST_RESULT' && h.amount > 6) ||
        (h.source === 'WRITTEN_WORK_RESULT' && h.amount > 16) ||
        (h.source === 'ADMIN_ADD' && h.amount > 35),
    )
    const anomaliesDedup = [...weirdFlags]
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 35)
      .map((h) => {
        let detail = ''
        let kind = 'other'
        let severity: 'info' | 'warn' = 'info'
        if (h.source === 'TEST_RESULT' && h.amount > 6) {
          kind = 'test_high'
          severity = 'warn'
          detail = `Kunlik testdan ${h.amount} ∞ (odatda 1–5)`
        } else if (h.source === 'WRITTEN_WORK_RESULT' && h.amount > 16) {
          kind = 'written_high'
          severity = 'warn'
          detail = `Yozma ishdan ${h.amount} ∞ (odatda 1–15)`
        } else if (h.source === 'ADMIN_ADD' && h.amount > 35) {
          kind = 'admin_large'
          detail = `Admin qo‘shish: +${h.amount} ∞`
        }
        return {
          kind,
          severity,
          detail,
          id: h.id,
          userId: h.userId,
          amount: h.amount,
          source: h.source,
          createdAt: h.createdAt.toISOString(),
        }
      })

    const medianEarned =
      last30Days.length > 0
        ? [...last30Days.map((d) => d.earned)].sort((a, b) => a - b)[Math.floor(last30Days.length / 2)] ?? 0
        : 0
    const burstDays: { date: string; earned: number; ratio: number }[] = []
    for (const d of last30Days) {
      if (medianEarned > 0 && d.earned >= medianEarned * 2.5 && d.earned >= 15) {
        burstDays.push({ date: d.date, earned: d.earned, ratio: Math.round((d.earned / medianEarned) * 10) / 10 })
      }
    }
    burstDays.sort((a, b) => b.earned - a.earned)

    const userIdsForNames = new Set<string>()
    for (const r of topRows) userIdsForNames.add(r.userId)
    for (const r of recentRows) userIdsForNames.add(r.userId)
    for (const x of highFrequencyTop) userIdsForNames.add(x.userId)
    for (const a of anomaliesDedup) userIdsForNames.add(a.userId)

    const idList = [...userIdsForNames]
    const users =
      idList.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: idList } },
            select: {
              id: true,
              name: true,
              username: true,
              studentProfile: { select: { studentId: true } },
            },
          })
        : []
    const userMeta = new Map(users.map((u) => [u.id, u]))

    const enrich = (rows: typeof topRows) =>
      rows.map((r) => {
        const u = userMeta.get(r.userId)
        const gr = userToGroup.get(r.userId)
        return {
          ...r,
          createdAt: r.createdAt.toISOString(),
          userName: u?.name ?? '—',
          username: u?.username ?? null,
          studentId: u?.studentProfile?.studentId ?? null,
          groupName: gr?.name ?? null,
        }
      })

    const weeksInWindow = Math.max(windowMs / (7 * 24 * 60 * 60 * 1000), 1 / 7)
    const avgPerStudentPerWeek =
      totalStudentsInGroups > 0 ? earnedWindowTotal / totalStudentsInGroups / weeksInWindow : 0

    let pctChange: number | null = null
    if (earnedPriorTotal > 0) {
      pctChange = Math.round(((earnedWindowTotal - earnedPriorTotal) / earnedPriorTotal) * 1000) / 10
    } else if (earnedWindowTotal > 0) {
      pctChange = null
    }

    let trend: 'tez_oshmoqda' | 'barqaror' | 'pasaymoqda' | 'noma_lum' = 'noma_lum'
    if (earnedPriorTotal === 0 && earnedWindowTotal === 0) trend = 'noma_lum'
    else if (pctChange === null && earnedWindowTotal > 0) trend = 'barqaror'
    else if (pctChange !== null) {
      if (pctChange >= 25) trend = 'tez_oshmoqda'
      else if (pctChange <= -15) trend = 'pasaymoqda'
      else trend = 'barqaror'
    }

    const liabilityToIssuance =
      earnedWindowTotal > 0 ? Math.round((totalStudentBalance / earnedWindowTotal) * 10) / 10 : null

    const stabilityNotes: string[] = []
    if (trend === 'tez_oshmoqda') {
      stabilityNotes.push(
        'Oldingi bilan solishtirganda ∞ berish sezilarli oshgan — chegirma / to‘lov rejangizga ta’sir qilmasligi uchun tempni kuzating.',
      )
    }
    if (trend === 'pasaymoqda') {
      stabilityNotes.push(
        '∞ berish oldingi davrga nisbatan kamaygan — rag‘bat tizimi sal soviyapti yoki darslar kamaygan bo‘lishi mumkin.',
      )
    }
    if (liabilityToIssuance !== null && liabilityToIssuance > 8) {
      stabilityNotes.push(
        `Jami balans joriy davrda berilgan tushumni taxminan ${liabilityToIssuance} barobar — keyinchalik chegirma sifatida katta majburiyat.`,
      )
    }
    if (liabilityToIssuance !== null && liabilityToIssuance <= 2 && totalStudentBalance > 100) {
      stabilityNotes.push(
        'Balans nisbatan past, lekin tushum tez — yangi ∞ tez yig‘ilmoqda; chegirma fondini rejalashtirish osonroq.',
      )
    }
    if (avgPerStudentPerWeek > 15) {
      stabilityNotes.push(
        `O‘quvchi boshiga haftalik ~${Math.round(avgPerStudentPerWeek)} ∞ — yuqori chekka, limitlar bilan tekshirib turing.`,
      )
    }

    const stability = {
      earnedCurrentWindow: earnedWindowTotal,
      earnedPriorWindow: earnedPriorTotal,
      pctChangeVsPrior: pctChange,
      trend,
      windowDaysEffective: daysParam,
      totalLiabilityInfinity: totalStudentBalance,
      avgInfinityPerStudentWeek: Math.round(avgPerStudentPerWeek * 10) / 10,
      liabilityVsPeriodIssuance: liabilityToIssuance,
      notes: stabilityNotes,
    }

    const insights: string[] = []
    const periodLabel = `${tashkentYmd(windowStart)} — ${tashkentYmd(windowEnd)}`
    if (peakEarnedDay && peakEarnedDay.earned > 0) {
      insights.push(
        `Tanlangan davrda eng ko‘p tushum: ${peakEarnedDay.date} (${peakEarnedDay.earned.toLocaleString('uz-UZ')} ∞, ${peakEarnedDay.count} yozuv).`,
      )
    }
    const testSrc = bySourceAll.find((s) => s.source === 'TEST_RESULT')
    const allEarnedHistory = bySourceAll.reduce((s, x) => s + (x.totalAmount ?? 0), 0)
    if (testSrc && allEarnedHistory > 0) {
      const pct = Math.round(((testSrc.totalAmount ?? 0) / allEarnedHistory) * 100)
      insights.push(`Butun tarix: «Kunlik test» tushumlardagi ulushi ~${pct}%.`)
    }
    if (nonStudent.txWindow > 0) {
      insights.push(
        `Tanlangan davrda ${nonStudent.txWindow} ta tushum yozuvi guruhsiz akkauntlarga tegishli.`,
      )
    }
    if (burstDays.length > 0) {
      insights.push(
        `Oxirgi 30 kunda medianadan keskin yuqori kunlar: ${burstDays
          .slice(0, 3)
          .map((b) => `${b.date} (+${b.earned} ∞)`)
          .join(', ')}.`,
      )
    }
    if (highFrequencyTop.length > 0) {
      insights.push(`Bir kunida 8+ marta ∞ olganlar bor — dublikat yoki intensiv kun ekanini tekshiring.`)
    }
    const topGroupByEarned = [...byGroupList].sort((a, b) => b.earnedWindow - a.earnedWindow)[0]
    if (topGroupByEarned && topGroupByEarned.earnedWindow > 0) {
      insights.push(
        `Eng faol guruh (tushum): «${topGroupByEarned.groupName}» — ${topGroupByEarned.earnedWindow.toLocaleString('uz-UZ')} ∞.`,
      )
    }
    if (topTests[0]) {
      insights.push(
        `Eng ko‘p ishtirok etilgan test: «${topTests[0].title}» — ${topTests[0].resultCount} ta natija, jami ${topTests[0].totalInfinity} ∞.`,
      )
    }
    if (topWrittenWorks[0]) {
      insights.push(
        `Eng ko‘p topshirilgan yozma ish: «${topWrittenWorks[0].title}» — ${topWrittenWorks[0].resultCount} ta, ${topWrittenWorks[0].totalInfinity} ∞.`,
      )
    }
    if (peakHourEarned.total > 0) {
      const h = peakHourEarned.hour
      const next = (h + 1) % 24
      insights.push(
        `(Toshkent) eng ko‘p tushum: ${String(h).padStart(2, '0')}:00–${String(next).padStart(2, '0')}:00 — ${peakHourEarned.total.toLocaleString('uz-UZ')} ∞.`,
      )
    }
    const anomaliesOut = anomaliesDedup.map((a) => ({
      ...a,
      userName: userMeta.get(a.userId)?.name ?? '—',
      username: userMeta.get(a.userId)?.username ?? null,
      groupName: userToGroup.get(a.userId)?.name ?? null,
    }))

    const groupsForFilter = groupsWithEnrollments.map((g) => ({ id: g.id, name: g.name }))

    return NextResponse.json({
      generatedAt: now.toISOString(),
      sourceLabels: SOURCE_LABELS,
      filters: {
        windowStart: windowStart.toISOString(),
        windowEnd: windowEnd.toISOString(),
        days: daysParam,
        groupId: groupId ?? null,
        source: sourceFilter || null,
        dateFrom,
        dateTo,
        periodLabel,
      },
      groupsForFilter,
      summary: {
        totalStudentBalance,
        totalStudentsInGroups,
        averageBalancePerStudent:
          totalStudentsInGroups > 0 ? Math.round(totalStudentBalance / totalStudentsInGroups) : 0,
        earnedInPeriod: earnedWindowTotal,
        transactionsInPeriod: historyWindowFiltered.length,
        nonStudentFlows: nonStudent,
      },
      stability,
      byGroup: byGroupList,
      topTests,
      topWrittenWorks,
      bySourceWindow: bySourceWindowMapped,
      bySourceAllTime: bySourceAll,
      daily: dailySorted,
      hourly: hourlyEarned.map((total: number, hour: number) => ({ hour, total })),
      peakHourEarned,
      byWeekday,
      peakEarnedDayInWindow: peakEarnedDay,
      peakEarnedDayLast30: peakEarned30,
      burstDaysLast30: burstDays.slice(0, 10),
      topTransactions: enrich(topRows),
      recentTransactions: enrich(recentRows),
      highFrequencyDays: highFrequencyTop.map((x) => {
        const u = userMeta.get(x.userId)
        const gr = userToGroup.get(x.userId)
        return {
          ...x,
          userName: u?.name ?? '—',
          username: u?.username ?? null,
          groupName: gr?.name ?? null,
        }
      }),
      anomalies: anomaliesOut,
      insights,
    })
  } catch (e) {
    console.error('rahbar infinity-analytics', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
