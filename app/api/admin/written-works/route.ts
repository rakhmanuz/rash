import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get all written works
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

    const where: any = {}
    if (groupId) {
      where.groupId = groupId
    }
    // Don't filter by date in where clause, we'll filter after fetching to check classSchedule.date too
    const writtenWorks = await prisma.writtenWork.findMany({
      where: groupId ? { groupId } : {},
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        results: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    // If date filter is applied, also filter by classSchedule.date
    // O'zbekiston vaqti (UTC+5) bilan ishlaymiz
    let filteredWorks = writtenWorks
    if (date) {
      const UZBEKISTAN_OFFSET = 5 * 60 * 60 * 1000 // 5 soat millisekundlarda
      let filterDateObj: Date
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split('-').map(Number)
        filterDateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - UZBEKISTAN_OFFSET)
      } else {
        filterDateObj = new Date(date)
      }
      const filterUzDate = new Date(filterDateObj.getTime() + UZBEKISTAN_OFFSET)
      const filterDateStr = `${filterUzDate.getUTCFullYear()}-${String(filterUzDate.getUTCMonth() + 1).padStart(2, '0')}-${String(filterUzDate.getUTCDate()).padStart(2, '0')}`
      
      filteredWorks = writtenWorks.filter((work) => {
        // Check work.date - O'zbekiston vaqtida
        const workDate = new Date(work.date)
        const workUzDate = new Date(workDate.getTime() + UZBEKISTAN_OFFSET)
        const workDateStr = `${workUzDate.getUTCFullYear()}-${String(workUzDate.getUTCMonth() + 1).padStart(2, '0')}-${String(workUzDate.getUTCDate()).padStart(2, '0')}`
        
        return workDateStr === filterDateStr
      })
      
      console.log('Filtered written works count:', filteredWorks.length, 'out of', writtenWorks.length)
    }

    return NextResponse.json(filteredWorks)
  } catch (error) {
    console.error('Error fetching written works:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Create written work
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
    const { groupId, date, maxScore, title, description, classScheduleId } = body

    if (!groupId || !date || !maxScore) {
      return NextResponse.json(
        { error: 'GroupId, date va maxScore kerak' },
        { status: 400 }
      )
    }

    // Validate classScheduleId if provided
    if (classScheduleId) {
      const schedule = await prisma.classSchedule.findUnique({
        where: { id: classScheduleId },
      })
      if (!schedule) {
        return NextResponse.json(
          { error: 'Dars rejasi topilmadi' },
          { status: 404 }
        )
      }
      if (schedule.groupId !== groupId) {
        return NextResponse.json(
          { error: 'Dars rejasi tanlangan guruhga tegishli emas' },
          { status: 400 }
        )
      }
    }

    // Validate and parse date
    // O'zbekiston vaqti (UTC+5) bilan ishlaymiz
    const [year, month, day] = date.split('-').map(Number)
    if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
      return NextResponse.json(
        { error: 'Noto\'g\'ri sana formati' },
        { status: 400 }
      )
    }
    
    // O'zbekiston vaqtida sana yaratish (UTC+5)
    const UZBEKISTAN_OFFSET = 5 * 60 * 60 * 1000 // 5 soat millisekundlarda
    const dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - UZBEKISTAN_OFFSET)
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { error: 'Noto\'g\'ri sana formati' },
        { status: 400 }
      )
    }
    
    console.log('Creating written work with date:', date, '->', dateObj.toISOString(), 'Uzbekistan date:', new Date(dateObj.getTime() + UZBEKISTAN_OFFSET).getUTCDate(), new Date(dateObj.getTime() + UZBEKISTAN_OFFSET).getUTCMonth() + 1, new Date(dateObj.getTime() + UZBEKISTAN_OFFSET).getUTCFullYear())

    const writtenWork = await prisma.writtenWork.create({
      data: {
        groupId,
        date: dateObj,
        maxScore: parseFloat(maxScore),
        title: title || null,
        description: description || null,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(writtenWork, { status: 201 })
  } catch (error: any) {
    console.error('Error creating written work:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    })
    return NextResponse.json(
      { 
        error: error?.message || 'Server error',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}
