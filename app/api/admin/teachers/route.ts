import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - Get all teachers
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

    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            phone: true,
          },
        },
        groups: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(teachers)
  } catch (error) {
    console.error('Error fetching teachers:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Create new teacher
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
    const { name, username, phone, password, teacherId, baseSalary, bonusRate } = body

    if (!name || !username || !password || !teacherId) {
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

    // Check if teacherId already exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { teacherId },
    })

    if (existingTeacher) {
      return NextResponse.json(
        { error: 'Bu o\'qituvchi ID allaqachon mavjud' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user and teacher
    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        phone: phone || null,
        password: hashedPassword,
        role: 'TEACHER',
        isActive: true,
        teacherProfile: {
          create: {
            teacherId,
            baseSalary: baseSalary || 0,
            bonusRate: bonusRate || 0,
            totalEarnings: 0,
          },
        },
      },
      include: {
        teacherProfile: {
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

    return NextResponse.json(newUser.teacherProfile, { status: 201 })
  } catch (error) {
    console.error('Error creating teacher:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
