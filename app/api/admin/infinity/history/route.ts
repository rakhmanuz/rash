import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const source = searchParams.get('source')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)

    const where: { userId?: string; source?: string } = {}
    if (userId) where.userId = userId
    if (source) where.source = source

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
