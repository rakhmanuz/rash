import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Barcha dars rejalarini olish
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

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    if (groupId) {
      where.groupId = groupId
    }
    
    // Sana formatlashni soddalashtirish - faqat date string (YYYY-MM-DD) ni qabul qilish
    // Database'da sana UTC formatida saqlanadi, shuning uchun UTC metodlaridan foydalanamiz
    if (startDate && endDate) {
      // Hafta davomidagi dars rejalarini olish
      let startDateObj: Date
      let endDateObj: Date
      
      if (startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = startDate.split('-').map(Number)
        // UTC formatida sana yaratish (kun boshlanishi)
        startDateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
      } else {
        startDateObj = new Date(startDate)
        startDateObj.setUTCHours(0, 0, 0, 0)
      }
      
      if (endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = endDate.split('-').map(Number)
        // UTC formatida sana yaratish (kun tugashi)
        endDateObj = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
      } else {
        endDateObj = new Date(endDate)
        endDateObj.setUTCHours(23, 59, 59, 999)
      }
      
      where.date = {
        gte: startDateObj,
        lte: endDateObj,
      }
    } else if (date) {
      // Bitta sana uchun
      let dateObj: Date
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split('-').map(Number)
        // UTC formatida sana yaratish
        dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
      } else {
        dateObj = new Date(date)
        dateObj.setUTCHours(0, 0, 0, 0)
      }
      // Kun boshlanishi va tugashi
      const startOfDay = new Date(dateObj)
      startOfDay.setUTCHours(0, 0, 0, 0)
      const endOfDay = new Date(dateObj)
      endOfDay.setUTCHours(23, 59, 59, 999)
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    const schedules = await prisma.classSchedule.findMany({
      where,
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
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Yangi dars rejasi qo'shish
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { groupId, date, times, notes } = body

    if (!groupId || !date || !times || !Array.isArray(times) || times.length === 0) {
      return NextResponse.json(
        { error: 'Guruh, sana va dars vaqtlari kerak' },
        { status: 400 }
      )
    }

    // Validate times format
    const validTimes = ['05:30', '06:00', '07:00', '08:00', '09:00', '10:00', '12:00', '13:00', '14:00', '14:30', '15:00', '16:00', '17:00', '18:00', '19:00']
    const invalidTimes = times.filter((time: string) => !validTimes.includes(time))
    if (invalidTimes.length > 0) {
      return NextResponse.json(
        { error: `Noto'g'ri dars vaqti: ${invalidTimes.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    })

    if (!group) {
      return NextResponse.json({ error: 'Guruh topilmadi' }, { status: 404 })
    }

    // Parse date and normalize to start of day (timezone muammosini oldini olish uchun)
    // Agar date YYYY-MM-DD formatida bo'lsa, UTC metodlaridan foydalanamiz
    let dateObj: Date
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number)
      dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    } else {
      dateObj = new Date(date)
      dateObj.setUTCHours(0, 0, 0, 0)
    }

    // Har safar yangi dars yaratish (bir guruhga bir kunda bir nechta dars qo'shish mumkin)
    // Bir xil vaqtda bir xil guruhga dars qo'shilganda ham yangi dars yaratiladi
    try {
      const newSchedule = await prisma.classSchedule.create({
        data: {
          groupId,
          date: dateObj,
          times: JSON.stringify(times),
          notes: notes || null,
        },
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

      return NextResponse.json(newSchedule, { status: 201 })
    } catch (createError) {
      console.error('Error in prisma.classSchedule.create:', createError)
      throw createError // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error creating schedule:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Log full error for debugging
    console.error('Full error details:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: errorMessage,
        // Only include stack in development
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    )
  }
}
