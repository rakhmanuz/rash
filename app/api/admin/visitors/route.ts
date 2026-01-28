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
    const realTimeSessions = new Set(realTimeVisitors.map(v => v.sessionId))
    const hourlySessions = new Set(hourlyVisitors.map(v => v.sessionId))
    const dailySessions = new Set(dailyVisitors.map(v => v.sessionId))

    // Count logged in vs anonymous
    const loggedInCount = realTimeVisitors.filter(v => v.userId !== null).length
    const anonymousCount = realTimeVisitors.length - loggedInCount

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


    return NextResponse.json({
      realTime: {
        count: realTimeSessions.size,
        loggedIn: loggedInCount,
        anonymous: anonymousCount,
      },
      hourly: {
        count: hourlySessions.size,
      },
      daily: {
        count: dailySessions.size,
      },
      pageViews: pageViews.map(pv => ({
        page: pv.page,
        count: pv._count.id,
      })),
      hourlyChart: hourlyData,
    })
  } catch (error) {
    console.error('Error fetching visitor stats:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
