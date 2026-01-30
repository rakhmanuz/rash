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
        classSchedule: {
          select: {
            id: true,
            date: true,
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
    let filteredWorks = writtenWorks
    if (date) {
      const dateObj = new Date(date)
      dateObj.setHours(0, 0, 0, 0)
      const filterDateStr = dateObj.toISOString().split('T')[0]
      
      filteredWorks = writtenWorks.filter((work) => {
        // Check work.date
        const workDate = new Date(work.date)
        workDate.setHours(0, 0, 0, 0)
        const workDateStr = workDate.toISOString().split('T')[0]
        
        // Check classSchedule.date if exists
        if (work.classSchedule) {
          const scheduleDate = new Date(work.classSchedule.date)
          scheduleDate.setHours(0, 0, 0, 0)
          const scheduleDateStr = scheduleDate.toISOString().split('T')[0]
          
          console.log('WrittenWork ID:', work.id, 'work.date:', workDateStr, 'schedule.date:', scheduleDateStr, 'filter:', filterDateStr)
          
          // Match if either work.date or classSchedule.date matches
          return workDateStr === filterDateStr || scheduleDateStr === filterDateStr
        }
        
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
    const { groupId, date, maxScore, title, description } = body

    if (!groupId || !date || !maxScore) {
      return NextResponse.json(
        { error: 'GroupId, date va maxScore kerak' },
        { status: 400 }
      )
    }

    const writtenWork = await prisma.writtenWork.create({
      data: {
        groupId,
        date: new Date(date),
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
