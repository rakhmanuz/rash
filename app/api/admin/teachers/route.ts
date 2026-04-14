import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
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
        subject: {
          select: {
            id: true,
            name: true,
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
    const { name, username, phone, password, teacherId, subjectId } = body

    if (!name || !username || !password || !teacherId) {
      return NextResponse.json(
        { error: 'Barcha maydonlar to\'ldirilishi kerak' },
        { status: 400 }
      )
    }

    const sid = typeof subjectId === 'string' ? subjectId.trim() : ''
    if (!sid) {
      return NextResponse.json({ error: 'Fan tanlanishi kerak' }, { status: 400 })
    }

    const subject = await prisma.subject.findFirst({
      where: { id: sid, isActive: true },
    })
    if (!subject) {
      return NextResponse.json({ error: 'Fan topilmadi yoki faol emas' }, { status: 400 })
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
            subject: { connect: { id: subject.id } },
            baseSalary: 0,
            bonusRate: 0,
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
    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        {
          error:
            "Ma'lumotlar bazasi clienti sxema bilan mos emas. `next dev` ni to'xtating, keyin loyiha ildizida `npx prisma generate` ni ishga tushiring.",
        },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
