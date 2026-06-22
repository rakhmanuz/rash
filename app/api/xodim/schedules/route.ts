import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uzDayBounds } from '@/lib/uzbekistan-time'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    })
    if (!user || user.role !== 'XODIM') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const userIdValue = String(session.user.id)
    let dateFilter: Prisma.Sql = Prisma.empty
    if (
      startDate &&
      endDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
      /^\d{4}-\d{2}-\d{2}$/.test(endDate)
    ) {
      const startBounds = uzDayBounds(startDate)
      const endBounds = uzDayBounds(endDate)
      dateFilter = Prisma.sql`AND "date" >= ${startBounds.gte} AND "date" <= ${endBounds.lte}`
    }

    const schedules = await prisma.$queryRaw<
      Array<{
        id: string
        date: Date | string
        times: string
        notes: string | null
        createdAt: Date | string
        updatedAt: Date | string
      }>
    >(Prisma.sql`
      SELECT "id", "date", "times", "notes", "createdAt", "updatedAt"
      FROM "EmployeeWorkSchedule"
      WHERE "userId" = ${userIdValue}
      ${dateFilter}
      ORDER BY "date" DESC, "createdAt" DESC
    `)

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Error fetching xodim schedules:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
