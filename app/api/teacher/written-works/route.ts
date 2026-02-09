import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get written works for teacher's groups
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teacherProfile: {
          include: {
            groups: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    if (!user || !user.teacherProfile) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    const groupIds = user.teacherProfile.groups.map(g => g.id)

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    const where: any = {
      groupId: {
        in: groupIds,
      },
    }

    if (date) {
      // O'zbekiston vaqti (UTC+5) bilan ishlaymiz
      const UZBEKISTAN_OFFSET = 5 * 60 * 60 * 1000 // 5 soat millisekundlarda
      let dateObj: Date
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split('-').map(Number)
        // O'zbekiston vaqtida sana yaratish
        dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - UZBEKISTAN_OFFSET)
      } else {
        dateObj = new Date(date)
      }
      // O'zbekiston vaqtida kun boshlanishi va tugashi
      const uzDate = new Date(dateObj.getTime() + UZBEKISTAN_OFFSET)
      const startOfDay = new Date(Date.UTC(uzDate.getUTCFullYear(), uzDate.getUTCMonth(), uzDate.getUTCDate(), 0, 0, 0, 0) - UZBEKISTAN_OFFSET)
      const endOfDay = new Date(Date.UTC(uzDate.getUTCFullYear(), uzDate.getUTCMonth(), uzDate.getUTCDate(), 23, 59, 59, 999) - UZBEKISTAN_OFFSET)
      
      console.log('Filtering teacher written works by date:', date, '->', startOfDay.toISOString(), 'to', endOfDay.toISOString())
      
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    const writtenWorks = await prisma.writtenWork.findMany({
      where,
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
        
        // Check classSchedule.date if exists - O'zbekiston vaqtida
        if (work.classSchedule) {
          const scheduleDate = new Date(work.classSchedule.date)
          const scheduleUzDate = new Date(scheduleDate.getTime() + UZBEKISTAN_OFFSET)
          const scheduleDateStr = `${scheduleUzDate.getUTCFullYear()}-${String(scheduleUzDate.getUTCMonth() + 1).padStart(2, '0')}-${String(scheduleUzDate.getUTCDate()).padStart(2, '0')}`
          
          console.log('Teacher Written Work ID:', work.id, 'work.date:', workDateStr, 'schedule.date:', scheduleDateStr, 'filter:', filterDateStr)
          
          // Match if either work.date or classSchedule.date matches
          return workDateStr === filterDateStr || scheduleDateStr === filterDateStr
        }
        
        return workDateStr === filterDateStr
      })
      
      console.log('Filtered teacher written works count:', filteredWorks.length, 'out of', writtenWorks.length)
    }

    return NextResponse.json(filteredWorks)
  } catch (error) {
    console.error('Error fetching written works:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
