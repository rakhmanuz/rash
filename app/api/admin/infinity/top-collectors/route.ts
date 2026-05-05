import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canReadInfinityManagement } from '@/lib/natijalar-read-auth'

/**
 * GET - Berilgan davrda eng ko'p infinity to'plagan foydalanuvchilar.
 * period=week (so'nggi 7 kun), month (so'nggi 30 kun), range (dateFrom & dateTo)
 * Faqat qo'shilgan ballar (amount > 0) hisobga olinadi.
 */
function getDateRange(period: string, dateFrom?: string, dateTo?: string): { from: Date; to: Date } {
  const now = new Date()
  const to = new Date(now)
  to.setHours(23, 59, 59, 999)

  if (period === 'range' && dateFrom && dateTo) {
    return {
      from: new Date(dateFrom + 'T00:00:00.000Z'),
      to: new Date(dateTo + 'T23:59:59.999Z'),
    }
  }

  if (period === 'month') {
    const from = new Date(now)
    from.setDate(from.getDate() - 30)
    from.setHours(0, 0, 0, 0)
    return { from, to }
  }

  // week (default)
  const from = new Date(now)
  from.setDate(from.getDate() - 7)
  from.setHours(0, 0, 0, 0)
  return { from, to }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    if (!currentUser || !canReadInfinityManagement(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const groupId = searchParams.get('groupId') || undefined
    const subjectId = searchParams.get('subjectId') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    const { from, to } = getDateRange(period, dateFrom, dateTo)

    const history = await prisma.infinityHistory.findMany({
      where: {
        amount: { gt: 0 },
        createdAt: { gte: from, lte: to },
      },
      select: {
        userId: true,
        amount: true,
      },
    })

    const byUser = new Map<string, { total: number; count: number }>()
    for (const h of history) {
      const cur = byUser.get(h.userId) || { total: 0, count: 0 }
      byUser.set(h.userId, {
        total: cur.total + h.amount,
        count: cur.count + 1,
      })
    }

    let userIds = [...byUser.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, limit)
      .map(([userId]) => userId)

    if ((groupId || subjectId) && userIds.length > 0) {
      const students = await prisma.student.findMany({
        where: { userId: { in: userIds } },
        select: { id: true, userId: true },
      })
      const studentIds = students.map((s) => s.id)
      const enrollments = await prisma.enrollment.findMany({
        where: {
          isActive: true,
          studentId: { in: studentIds },
          ...(groupId ? { groupId } : {}),
          ...(subjectId ? { group: { subjectId } } : {}),
        },
        select: { studentId: true },
      })
      const enrolledStudentIds = new Set(enrollments.map((e) => e.studentId))
      const allowedUserIds = new Set(students.filter((s) => enrolledStudentIds.has(s.id)).map((s) => s.userId))
      userIds = userIds.filter((id) => allowedUserIds.has(id))
    }

    if (userIds.length === 0) {
      return NextResponse.json({
        period: { from: from.toISOString(), to: to.toISOString() },
        periodLabel: period === 'range' ? `${dateFrom} — ${dateTo}` : period === 'month' ? "So'nggi 30 kun" : "So'nggi 7 kun",
        items: [],
      })
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        studentProfile: { select: { studentId: true } },
      },
    })

    const userMap = new Map(users.map((u) => [u.id, u]))
    const items = userIds
      .map((userId) => {
        const u = userMap.get(userId)
        const agg = byUser.get(userId)!
        if (!u) return null
        return {
          userId: u.id,
          name: u.name,
          username: u.username,
          role: u.role,
          studentId: u.studentProfile?.studentId ?? null,
          totalEarned: agg.total,
          actionCount: agg.count,
        }
      })
      .filter(Boolean) as {
      userId: string
      name: string
      username: string
      role: string
      studentId: string | null
      totalEarned: number
      actionCount: number
    }[]

    const periodLabel =
      period === 'range' && dateFrom && dateTo
        ? `${dateFrom} — ${dateTo}`
        : period === 'month'
          ? "So'nggi 30 kun"
          : "So'nggi 7 kun"

    return NextResponse.json({
      period: { from: from.toISOString(), to: to.toISOString() },
      periodLabel,
      items,
    })
  } catch (error) {
    console.error('Error fetching top collectors:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
