import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canReadInfinityManagement } from '@/lib/natijalar-read-auth'

// GET - Infinity harakati tarixi (barcha yoki userId bo'yicha)
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
    const userId = searchParams.get('userId')
    const source = searchParams.get('source')
    const dateFrom = searchParams.get('dateFrom') // YYYY-MM-DD
    const dateTo = searchParams.get('dateTo')   // YYYY-MM-DD
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)

    const where: { userId?: string; source?: string; createdAt?: { gte?: Date; lte?: Date } } = {}
    if (userId) where.userId = userId
    if (source) where.source = source
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom + 'T00:00:00.000Z')
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z')
    }

    const history = await prisma.infinityHistory.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            studentProfile: { select: { studentId: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error('Error fetching infinity history:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
