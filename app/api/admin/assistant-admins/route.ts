import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - Barcha yordamchi adminlarni olish
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

    const assistantAdmins = await prisma.user.findMany({
      where: {
        role: 'ASSISTANT_ADMIN',
      },
      include: {
        assistantAdminProfile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(assistantAdmins)
  } catch (error) {
    console.error('Error fetching assistant admins:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Yangi yordamchi admin yaratish
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
    const { username, name, password, phone, permissions } = body

    // Validatsiya
    if (!username || !name || !password) {
      return NextResponse.json(
        { error: 'Username, name va password majburiy' },
        { status: 400 }
      )
    }

    // Username takrorlanmasligini tekshirish
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu username allaqachon mavjud' },
        { status: 400 }
      )
    }

    // Parolni hash qilish
    const hashedPassword = await bcrypt.hash(password, 10)

    // Default permissions
    const defaultPermissions = {
      students: { view: false, create: false, edit: false, delete: false },
      teachers: { view: false, create: false, edit: false, delete: false },
      groups: { view: false, create: false, edit: false, delete: false },
      schedules: { view: false, create: false, edit: false, delete: false },
      tests: { view: false, create: false, edit: false, delete: false },
      payments: { view: false, create: false, edit: false, delete: false },
      market: { view: false, create: false, edit: false, delete: false },
      reports: { view: false },
    }

    const finalPermissions = permissions || defaultPermissions

    // User yaratish
    const newUser = await prisma.user.create({
      data: {
        username,
        name,
        password: hashedPassword,
        phone: phone || null,
        role: 'ASSISTANT_ADMIN',
        isActive: true,
      },
    })

    // AssistantAdmin profile yaratish
    const assistantAdminProfile = await prisma.assistantAdmin.create({
      data: {
        userId: newUser.id,
        permissions: JSON.stringify(finalPermissions),
      },
    })

    // User bilan birga qaytarish
    const userWithProfile = {
      ...newUser,
      assistantAdminProfile,
    }

    return NextResponse.json(
      {
        message: 'Yordamchi admin muvaffaqiyatli yaratildi',
        user: {
          ...userWithProfile,
          password: undefined, // Parolni qaytarmaymiz
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating assistant admin:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
