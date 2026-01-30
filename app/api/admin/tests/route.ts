import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get all tests
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
      
      console.log('Filtering tests by date:', date, '->', startOfDay.toISOString(), 'to', endOfDay.toISOString())
      
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
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
    // O'zbekiston vaqti (UTC+5) bilan ishlaymiz
    let filteredTests = tests
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
      
      filteredTests = tests.filter((test) => {
        // Check test.date - O'zbekiston vaqtida
        const testDate = new Date(test.date)
        const testUzDate = new Date(testDate.getTime() + UZBEKISTAN_OFFSET)
        const testDateStr = `${testUzDate.getUTCFullYear()}-${String(testUzDate.getUTCMonth() + 1).padStart(2, '0')}-${String(testUzDate.getUTCDate()).padStart(2, '0')}`
        
        // Check classSchedule.date if exists - O'zbekiston vaqtida
        if (test.classSchedule) {
          const scheduleDate = new Date(test.classSchedule.date)
          const scheduleUzDate = new Date(scheduleDate.getTime() + UZBEKISTAN_OFFSET)
          const scheduleDateStr = `${scheduleUzDate.getUTCFullYear()}-${String(scheduleUzDate.getUTCMonth() + 1).padStart(2, '0')}-${String(scheduleUzDate.getUTCDate()).padStart(2, '0')}`
          
          console.log('Test ID:', test.id, 'test.date:', testDateStr, 'schedule.date:', scheduleDateStr, 'filter:', filterDateStr)
          
          // Match if either test.date or classSchedule.date matches
          return testDateStr === filterDateStr || scheduleDateStr === filterDateStr
        }
        
        return testDateStr === filterDateStr
      })
      
      console.log('Filtered tests count:', filteredTests.length, 'out of', tests.length)
    }

    return NextResponse.json(filteredTests)
  } catch (error) {
    console.error('Error fetching tests:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Create test
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
    const { groupId, date, totalQuestions, type, title, description, classScheduleId } = body

    if (!groupId || !date || !totalQuestions || !type) {
      return NextResponse.json(
        { error: 'GroupId, date, totalQuestions va type kerak' },
        { status: 400 }
      )
    }

    if (type !== 'kunlik_test' && type !== 'uyga_vazifa') {
      return NextResponse.json(
        { error: 'Type "kunlik_test" yoki "uyga_vazifa" bo\'lishi kerak' },
        { status: 400 }
      )
    }

    // Validate and parse date
    // Date should be in YYYY-MM-DD format from frontend
    // O'zbekiston vaqti (UTC+5) bilan ishlaymiz
    const [year, month, day] = date.split('-').map(Number)
    if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
      return NextResponse.json(
        { error: 'Noto\'g\'ri sana formati' },
        { status: 400 }
      )
    }
    
    // O'zbekiston vaqtida sana yaratish (UTC+5)
    // UTC vaqtida 00:00:00, lekin O'zbekistonda 05:00:00 bo'ladi
    // Shuning uchun UTC dan 5 soat ayiramiz
    const UZBEKISTAN_OFFSET = 5 * 60 * 60 * 1000 // 5 soat millisekundlarda
    const dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - UZBEKISTAN_OFFSET)
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { error: 'Noto\'g\'ri sana formati' },
        { status: 400 }
      )
    }
    
    console.log('Creating test with date:', date, '->', dateObj.toISOString(), 'Uzbekistan date:', new Date(dateObj.getTime() + UZBEKISTAN_OFFSET).getUTCDate(), new Date(dateObj.getTime() + UZBEKISTAN_OFFSET).getUTCMonth() + 1, new Date(dateObj.getTime() + UZBEKISTAN_OFFSET).getUTCFullYear())

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
      // Ensure the schedule belongs to the same group
      if (schedule.groupId !== groupId) {
        return NextResponse.json(
          { error: 'Dars rejasi tanlangan guruhga tegishli emas' },
          { status: 400 }
        )
      }
    }

    const test = await prisma.test.create({
      data: {
        groupId,
        date: dateObj,
        totalQuestions: parseInt(totalQuestions),
        type,
        title: title || null,
        description: description || null,
        classScheduleId: classScheduleId || null,
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

    return NextResponse.json(test, { status: 201 })
  } catch (error: any) {
    console.error('Error creating test:', error)
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    )
  }
}
