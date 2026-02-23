import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get real-time visitor statistics
export async function GET(request: NextRequest) {
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

    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000) // 5 daqiqa oldin
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000) // 1 soat oldin
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 kun oldin

    // Real-time visitors (oxirgi 5 daqiqada faol)
    const realTimeVisitors = await prisma.visitorActivity.findMany({
      where: {
        lastActivity: {
          gte: fiveMinutesAgo,
        },
      },
      distinct: ['sessionId'],
    })

    // Hourly visitors
    const hourlyVisitors = await prisma.visitorActivity.findMany({
      where: {
        lastActivity: {
          gte: oneHourAgo,
        },
      },
      distinct: ['sessionId'],
    })

    // Daily visitors
    const dailyVisitors = await prisma.visitorActivity.findMany({
      where: {
        lastActivity: {
          gte: oneDayAgo,
        },
      },
      distinct: ['sessionId'],
    })

    // Get unique visitors with user info
    type VisitorRow = { sessionId: string; userId: string | null; page: string; lastActivity: Date }
    const realTimeSessions = new Set(realTimeVisitors.map((v: VisitorRow) => v.sessionId))
    const hourlySessions = new Set(hourlyVisitors.map((v: VisitorRow) => v.sessionId))
    const dailySessions = new Set(dailyVisitors.map((v: VisitorRow) => v.sessionId))

    // Count logged in vs anonymous
    const loggedInCount = realTimeVisitors.filter((v: VisitorRow) => v.userId !== null).length
    const anonymousCount = realTimeVisitors.length - loggedInCount

    // Hozir tizimda kirgan foydalanuvchilar (login, ism, sahifa, oxirgi faoliyat)
    const activeLoggedIn = realTimeVisitors.filter((v: VisitorRow) => v.userId)
    const uniqueUserIds = [...new Set(activeLoggedIn.map((v: VisitorRow) => v.userId!))]
    const activeUsers = uniqueUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: uniqueUserIds } },
          select: { id: true, username: true, name: true, role: true },
        })
      : []
    const userActivityMap = new Map<string, { page: string; lastActivity: Date }>()
    activeLoggedIn.forEach((v: VisitorRow) => {
      if (v.userId) {
        const existing = userActivityMap.get(v.userId)
        if (!existing || new Date(v.lastActivity) > existing.lastActivity) {
          userActivityMap.set(v.userId, { page: v.page, lastActivity: v.lastActivity })
        }
      }
    })
    const activeLoggedInUsers = activeUsers.map((u: { id: string; username: string | null; name: string | null; role: string }) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      page: userActivityMap.get(u.id)?.page || '-',
      lastActivity: userActivityMap.get(u.id)?.lastActivity,
    }))

    // Get page views
    const pageViews = await prisma.visitorActivity.groupBy({
      by: ['page'],
      where: {
        lastActivity: {
          gte: oneDayAgo,
        },
      },
      _count: {
        id: true,
      },
    })

    // Get visitors by hour (last 24 hours)
    const hourlyData = []
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000)
      const hourEnd = new Date(now.getTime() - (i - 1) * 60 * 60 * 1000)
      
      const hourVisitors = await prisma.visitorActivity.findMany({
        where: {
          lastActivity: {
            gte: hourStart,
            lt: hourEnd,
          },
        },
        distinct: ['sessionId'],
      })

      hourlyData.push({
        hour: hourStart.getHours(),
        label: `${hourStart.getHours()}:00`,
        visitors: hourVisitors.length,
      })
    }


    // Kirish tarixi (oxirgi 100 ta) - kim, qachon, IP, rol
    let loginHistory: Array<{ id: string; username: string; name: string; role: string; ipAddress: string | null; userAgent: string | null; loginAt: Date }> = []
    try {
      loginHistory = await prisma.authLog.findMany({
        orderBy: { loginAt: 'desc' },
        take: 500,
      })
    } catch (_) {
      // AuthLog jadvali yoki Prisma client yangilanmagan bo'lsa bo'sh qator
    }

    // Bugun kirganlar (loginAt bugungi sana)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const todayLogins = loginHistory.filter((l: { loginAt: Date }) => new Date(l.loginAt) >= todayStart)

    // Oxirgi 24 soatda tashrif buyurganlar ro'yxati (har bir session bir marta, kim kirgan/anonim)
    const dailySessionsList = dailyVisitors
      .sort((a: VisitorRow, b: VisitorRow) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    const dailyUserIds = [...new Set(dailySessionsList.filter((v: VisitorRow) => v.userId).map((v: VisitorRow) => v.userId!))]
    const dailyUsers = dailyUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: dailyUserIds } },
          select: { id: true, username: true, name: true, role: true },
        })
      : []
    type UserRow = { id: string; username: string | null; name: string | null; role: string }
    const userMap = new Map<string, UserRow>(dailyUsers.map((u: UserRow) => [u.id, u]))
    const dailyVisitorsList = dailySessionsList.map((v: VisitorRow) => {
      const user: UserRow | undefined = v.userId ? userMap.get(v.userId) : undefined
      return {
        sessionId: v.sessionId,
        userId: v.userId,
        username: user?.username ?? null,
        name: user?.name ?? null,
        role: user?.role ?? null,
        isAnonymous: !v.userId,
        page: v.page,
        lastActivity: v.lastActivity,
      }
    })

    return NextResponse.json({
      realTime: {
        count: realTimeSessions.size,
        loggedIn: loggedInCount,
        anonymous: anonymousCount,
        activeLoggedInUsers,
      },
      hourly: {
        count: hourlySessions.size,
      },
      daily: {
        count: dailySessions.size,
      },
      pageViews: pageViews.map((pv: { page: string | null; _count: { id: number } }) => ({
        page: pv.page,
        count: pv._count.id,
      })),
      hourlyChart: hourlyData,
      loginHistory: loginHistory.map((l: { id: string; username: string; name: string | null; role: string; ipAddress: string | null; userAgent: string | null; loginAt: Date }) => ({
        id: l.id,
        username: l.username,
        name: l.name,
        role: l.role,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        loginAt: l.loginAt,
      })),
      todayLogins: todayLogins.map((l: { id: string; username: string; name: string | null; role: string; ipAddress: string | null; userAgent: string | null; loginAt: Date }) => ({
        id: l.id,
        username: l.username,
        name: l.name,
        role: l.role,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        loginAt: l.loginAt,
      })),
      dailyVisitorsList,
    })
  } catch (error) {
    console.error('Error fetching visitor stats:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
