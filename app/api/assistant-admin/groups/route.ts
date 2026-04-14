import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasSectionAccess } from '@/lib/permissions'

// GET - Get all groups (for assigning students)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || user.role !== 'ASSISTANT_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const canViewGroups = await hasSectionAccess(user.id, user.role, 'groups', 'view')
    if (!canViewGroups) {
      return NextResponse.json({ error: "Sizda guruhlarni ko'rish ruxsati yo'q" }, { status: 403 })
    }

    const enrollInc = {
      where: { isActive: true },
      select: { id: true },
    } as const

    let groups
    try {
      groups = await prisma.group.findMany({
        where: { isActive: true },
        include: {
          subject: { select: { id: true, name: true } },
          enrollments: enrollInc,
        },
        orderBy: { name: 'asc' },
      })
    } catch (e) {
      console.warn('[assistant-admin/groups GET] subject include failed, retrying:', e)
      groups = await prisma.group.findMany({
        where: { isActive: true },
        include: { enrollments: enrollInc },
        orderBy: { name: 'asc' },
      })
    }

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
