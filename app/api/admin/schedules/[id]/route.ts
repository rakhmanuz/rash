import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canMutateAdminSchedules } from '@/lib/admin-api-access'
import { isValidClassScheduleTime } from '@/lib/class-schedule-times'
import { parseScheduleDateUtc } from '@/lib/schedule-date'

// PUT - Dars rejasini yangilash
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !(await canMutateAdminSchedules(user.id, user.role, 'edit'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { date, times, notes } = body

    if (!times || !Array.isArray(times) || times.length === 0) {
      return NextResponse.json(
        { error: 'Dars vaqtlari kerak' },
        { status: 400 }
      )
    }

    // Validate times format
    const invalidTimes = times.filter((time: string) => !isValidClassScheduleTime(time))
    if (invalidTimes.length > 0) {
      return NextResponse.json(
        { error: `Noto'g'ri dars vaqti: ${invalidTimes.join(', ')}` },
        { status: 400 }
      )
    }

    const updateData: any = {
      times: JSON.stringify(times),
      notes: notes !== undefined ? notes : undefined,
    }

    if (date) {
      updateData.date = parseScheduleDateUtc(date)
    }

    const updated = await prisma.classSchedule.update({
      where: { id: params.id },
      data: updateData,
      include: {
        group: {
          include: {
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating schedule:', error)
    if (error instanceof Error && error.message.includes('Record to update does not exist')) {
      return NextResponse.json({ error: 'Dars rejasi topilmadi' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Dars rejasini o'chirish
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !(await canMutateAdminSchedules(user.id, user.role, 'delete'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.classSchedule.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Dars rejasi o\'chirildi' })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Dars rejasi topilmadi' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
