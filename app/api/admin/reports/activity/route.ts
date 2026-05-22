import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

const STAFF_ROLES = ['ADMIN', 'MANAGER', 'TEACHER', 'RAHBAR'] as const

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const roleFilter = searchParams.get('role')?.trim() || ''
    const categoryFilter = searchParams.get('category')?.trim() || ''
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '80', 10) || 80))

    const where: Prisma.ActivityLogWhereInput = {
      actorRole: { in: [...STAFF_ROLES] },
    }

    if (roleFilter && STAFF_ROLES.includes(roleFilter as (typeof STAFF_ROLES)[number])) {
      where.actorRole = roleFilter
    }
    if (categoryFilter) {
      where.category = categoryFilter
    }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          actorUserId: true,
          actorRole: true,
          actorName: true,
          action: true,
          category: true,
          summary: true,
          entityType: true,
          entityId: true,
          createdAt: true,
        },
      }),
      prisma.activityLog.count({ where }),
    ])

    return NextResponse.json({ items, total, limit })
  } catch (error) {
    console.error('Activity log fetch error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
