import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isValidClassScheduleTime } from '@/lib/class-schedule-times'
import { parseScheduleDateUtc } from '@/lib/schedule-date'

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminOrManager()
    if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const date = typeof body?.date === 'string' ? body.date : ''
    const times = Array.isArray(body?.times) ? body.times : []
    const notes = body?.notes

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || times.length === 0) {
      return NextResponse.json({ error: 'Sana va ish vaqtlari kerak' }, { status: 400 })
    }
    const invalidTimes = times.filter((time: string) => !isValidClassScheduleTime(time))
    if (invalidTimes.length > 0) {
      return NextResponse.json({ error: `Noto'g'ri vaqt: ${invalidTimes.join(', ')}` }, { status: 400 })
    }

    const existing = await prisma.$queryRaw<
      Array<{ id: string; userId: string; user_role: string }>
    >(Prisma.sql`
      SELECT ews."id", ews."userId", u."role" AS user_role
      FROM "EmployeeWorkSchedule" ews
      INNER JOIN "User" u ON u."id" = ews."userId"
      WHERE ews."id" = ${params.id}
      LIMIT 1
    `)
    if (!existing[0] || existing[0].user_role !== 'XODIM') {
      return NextResponse.json({ error: 'Jadval topilmadi' }, { status: 404 })
    }

    const now = new Date()
    await prisma.$executeRaw(Prisma.sql`
      UPDATE "EmployeeWorkSchedule"
      SET
        "date" = ${parseScheduleDateUtc(date)},
        "times" = ${JSON.stringify(times)},
        "notes" = ${notes ? String(notes).trim() : null},
        "updatedAt" = ${now}
      WHERE "id" = ${params.id}
    `)

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
      WHERE ews."id" = ${params.id}
      LIMIT 1
    `)

    const row = rows[0]
    if (!row) {
      return NextResponse.json({ error: 'Jadval topilmadi' }, { status: 404 })
    }
    const updated = {
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
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating employee schedule:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminOrManager()
    if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const existing = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id" FROM "EmployeeWorkSchedule" WHERE "id" = ${params.id} LIMIT 1
    `)
    if (!existing[0]) {
      return NextResponse.json({ error: 'Jadval topilmadi' }, { status: 404 })
    }

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM "EmployeeWorkSchedule" WHERE "id" = ${params.id}
    `)
    return NextResponse.json({ message: 'Jadval o\'chirildi' })
  } catch (error) {
    console.error('Error deleting employee schedule:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
