import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CLASS_SCHEDULE_VALID_TIMES, isValidClassScheduleTime } from '@/lib/class-schedule-times'
import { parseScheduleDateUtc } from '@/lib/schedule-date'
import { uzDayBounds } from '@/lib/uzbekistan-time'

function normalizeDateList(body: { date?: unknown; dates?: unknown }): string[] {
  const raw: string[] = []
  if (Array.isArray(body.dates)) {
    for (const d of body.dates) {
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) raw.push(d)
    }
  } else if (typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    raw.push(body.date)
  }
  return [...new Set(raw)]
}

async function requireAdminOrManager() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  })
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) return null
  return { session, user }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminOrManager()
    if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const userFilter = userId ? Prisma.sql`AND ews."userId" = ${String(userId)}` : Prisma.empty
    let dateFilter: Prisma.Sql = Prisma.empty
    if (
      startDate &&
      endDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
      /^\d{4}-\d{2}-\d{2}$/.test(endDate)
    ) {
      const startBounds = uzDayBounds(startDate)
      const endBounds = uzDayBounds(endDate)
      dateFilter = Prisma.sql`AND ews."date" >= ${startBounds.gte} AND ews."date" <= ${endBounds.lte}`
    }

    const rows = await prisma.$queryRaw<
      Array<{
        id: string
        userId: string
        date: Date | string
        times: string
        notes: string | null
        createdAt: Date | string
        updatedAt: Date | string
        user_name: string
        user_username: string
        user_employeeType: string | null
      }>
    >(Prisma.sql`
      SELECT
        ews."id",
        ews."userId",
        ews."date",
        ews."times",
        ews."notes",
        ews."createdAt",
        ews."updatedAt",
        u."name" AS user_name,
        u."username" AS user_username,
        u."employeeType" AS user_employeeType
      FROM "EmployeeWorkSchedule" ews
      INNER JOIN "User" u ON u."id" = ews."userId"
      WHERE 1=1
      ${userFilter}
      ${dateFilter}
      ORDER BY ews."date" DESC, ews."createdAt" DESC
    `)

    const schedules = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      date: row.date,
      times: row.times,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.userId,
        name: row.user_name,
        username: row.user_username,
        employeeType: row.user_employeeType,
      },
    }))

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Error fetching employee schedules:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminOrManager()
    if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { userId, times, notes } = body || {}
    const userIdValue = typeof userId === 'string' ? userId : String(userId || '')
    const dateList = normalizeDateList(body)

    if (!userIdValue || dateList.length === 0 || !Array.isArray(times) || times.length === 0) {
      return NextResponse.json(
        { error: 'Xodim, kamida bitta sana va ish vaqtlarini tanlang' },
        { status: 400 }
      )
    }

    const invalidTimes = times.filter((time: string) => !isValidClassScheduleTime(time))
    if (invalidTimes.length > 0) {
      return NextResponse.json(
        {
          error: `Noto'g'ri vaqt: ${invalidTimes.join(', ')}. Ruxsat etilgan: ${CLASS_SCHEDULE_VALID_TIMES.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const employee = await prisma.user.findUnique({
      where: { id: userIdValue },
      select: { id: true, role: true, isActive: true },
    })
    if (!employee || employee.role !== 'XODIM' || !employee.isActive) {
      return NextResponse.json({ error: 'Xodim topilmadi yoki nofaol' }, { status: 404 })
    }

    const createdIds: string[] = []
    const now = new Date()
    const notesValue = notes ? String(notes).trim() : null

    for (const dateStr of dateList) {
      const dateObj = parseScheduleDateUtc(dateStr)
      const id = randomUUID()
      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO "EmployeeWorkSchedule" ("id", "userId", "date", "times", "notes", "createdAt", "updatedAt")
        VALUES (${id}, ${userIdValue}, ${dateObj}, ${JSON.stringify(times)}, ${notesValue}, ${now}, ${now})
      `)
      createdIds.push(id)
    }

    const rows = await prisma.$queryRaw<
      Array<{
        id: string
        userId: string
        date: Date | string
        times: string
        notes: string | null
        createdAt: Date | string
        updatedAt: Date | string
        user_name: string
        user_username: string
        user_employeeType: string | null
      }>
    >(Prisma.sql`
      SELECT
        ews."id",
        ews."userId",
        ews."date",
        ews."times",
        ews."notes",
        ews."createdAt",
        ews."updatedAt",
        u."name" AS user_name,
        u."username" AS user_username,
        u."employeeType" AS user_employeeType
      FROM "EmployeeWorkSchedule" ews
      INNER JOIN "User" u ON u."id" = ews."userId"
      WHERE ews."id" IN (${Prisma.join(createdIds)})
      ORDER BY ews."date" DESC, ews."createdAt" DESC
    `)

    const schedules = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      date: row.date,
      times: row.times,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.userId,
        name: row.user_name,
        username: row.user_username,
        employeeType: row.user_employeeType,
      },
    }))

    return NextResponse.json({ schedules, count: schedules.length }, { status: 201 })
  } catch (error) {
    console.error('Error creating employee schedule:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
