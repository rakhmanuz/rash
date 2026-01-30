import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get tests for teacher's groups
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
    const type = searchParams.get('type')

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
      
      console.log('Filtering teacher tests by date:', date, '->', startOfDay.toISOString(), 'to', endOfDay.toISOString())
      
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    if (type) {
      where.type = type
    }

    const tests = await prisma.test.findMany({
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
    let filteredTests = tests
    if (date) {
      const dateObj = new Date(date)
      dateObj.setHours(0, 0, 0, 0)
      const filterDateStr = dateObj.toISOString().split('T')[0]
      
      filteredTests = tests.filter((test) => {
        // Check test.date
        const testDate = new Date(test.date)
        testDate.setHours(0, 0, 0, 0)
        const testDateStr = testDate.toISOString().split('T')[0]
        
        // Check classSchedule.date if exists
        if (test.classSchedule) {
          const scheduleDate = new Date(test.classSchedule.date)
          scheduleDate.setHours(0, 0, 0, 0)
          const scheduleDateStr = scheduleDate.toISOString().split('T')[0]
          
          console.log('Teacher Test ID:', test.id, 'test.date:', testDateStr, 'schedule.date:', scheduleDateStr, 'filter:', filterDateStr)
          
          // Match if either test.date or classSchedule.date matches
          return testDateStr === filterDateStr || scheduleDateStr === filterDateStr
        }
        
        return testDateStr === filterDateStr
      })
      
      console.log('Filtered teacher tests count:', filteredTests.length, 'out of', tests.length)
    }

    return NextResponse.json(filteredTests)
  } catch (error) {
    console.error('Error fetching tests:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
