import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - Get all students
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
    const includeEnrollment = searchParams.get('includeEnrollment') === 'true'

    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            phone: true,
            isActive: true,
          },
        },
        enrollments: includeEnrollment
          ? {
              where: { isActive: true },
              select: {
                id: true,
                groupId: true,
                group: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            }
          : false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format students with currentGroupId and groupName
    const formattedStudents = students.map((student) => {
      const enrollment = includeEnrollment && student.enrollments.length > 0 
        ? student.enrollments[0] as any
        : null
      
      return {
        id: student.id,
        studentId: student.studentId,
        user: student.user,
        level: student.level,
        totalScore: student.totalScore,
        attendanceRate: student.attendanceRate,
        masteryLevel: student.masteryLevel,
        currentGroupId: enrollment?.groupId,
        currentGroupName: enrollment?.group?.name,
      }
    })

    return NextResponse.json(formattedStudents)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Create new student
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
    const { name, username, phone, password, studentId } = body

    if (!name || !username || !password || !studentId) {
      return NextResponse.json(
        { error: 'Barcha maydonlar to\'ldirilishi kerak' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu login allaqachon mavjud' },
        { status: 400 }
      )
    }

    // Check if studentId already exists
    const existingStudent = await prisma.student.findUnique({
      where: { studentId },
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Bu o\'quvchi ID allaqachon mavjud' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user and student
    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        phone: phone || null,
        password: hashedPassword,
        role: 'STUDENT',
        isActive: true,
        studentProfile: {
          create: {
            studentId,
            level: 1,
            totalScore: 0,
            attendanceRate: 0,
            masteryLevel: 0,
          },
        },
      },
      include: {
        studentProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(newUser.studentProfile, { status: 201 })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
