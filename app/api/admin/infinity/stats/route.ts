import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canReadInfinityManagement } from '@/lib/natijalar-read-auth'

/**
 * GET - Infinity statistikalar:
 * - summary: jami ∞, foydalanuvchilar soni, o'rtacha (umumiy yoki guruh bo'yicha)
 * - byGroup: har bir guruh bo'yicha jami ∞, o'quvchilar soni, o'rtacha
 * - bySource: ballar qayerdan kelgani (Kunlik test, Yozma ish, Admin, Market)
 */
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
    const groupId = searchParams.get('groupId') || undefined

    // Guruhlar ro'yxati va har bir guruhdagi o'quvchilarning infinity yig'indisi
    const groupsWithEnrollments = await prisma.group.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        enrollments: {
          where: { isActive: true },
          select: {
            student: {
              select: {
                user: {
                  select: { infinityPoints: true },
                },
              },
            },
          },
        },
      },
    })

    type GroupWithEnrollments = (typeof groupsWithEnrollments)[number]
    const byGroup = groupsWithEnrollments.map((g: GroupWithEnrollments) => {
      const points = g.enrollments.map((e: GroupWithEnrollments['enrollments'][number]) =>
        e.student.user.infinityPoints ?? 0,
      )
      const totalInfinity = points.reduce((s: number, p: number) => s + p, 0)
      const userCount = points.length
      return {
        groupId: g.id,
        groupName: g.name,
        totalInfinity,
        userCount,
        averageInfinity: userCount > 0 ? Math.round(totalInfinity / userCount) : 0,
      }
    })

    // Umumiy summary (yoki tanlangan guruh bo'yicha)
    let summary: { totalInfinity: number; totalUsers: number; averageInfinity: number }
    if (groupId) {
      const g = byGroup.find((x) => x.groupId === groupId)
      summary = g
        ? {
            totalInfinity: g.totalInfinity,
            totalUsers: g.userCount,
            averageInfinity: g.averageInfinity,
          }
        : { totalInfinity: 0, totalUsers: 0, averageInfinity: 0 }
    } else {
      const totalInfinity = byGroup.reduce((s, x) => s + x.totalInfinity, 0)
      const totalUsers = byGroup.reduce((s, x) => s + x.userCount, 0)
      summary = {
        totalInfinity,
        totalUsers,
        averageInfinity: totalUsers > 0 ? Math.round(totalInfinity / totalUsers) : 0,
      }
    }

    // Manba bo'yicha: InfinityHistory orqali qayerdan kelgani
    const bySourceRaw = await prisma.infinityHistory.groupBy({
      by: ['source'],
      _sum: { amount: true },
      _count: true,
    })

    const bySource = bySourceRaw.map((x: (typeof bySourceRaw)[number]) => ({
      source: x.source,
      totalAmount: x._sum.amount ?? 0,
      count: x._count,
    }))

    return NextResponse.json({
      summary,
      byGroup,
      bySource,
    })
  } catch (error) {
    console.error('Error fetching infinity stats:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
