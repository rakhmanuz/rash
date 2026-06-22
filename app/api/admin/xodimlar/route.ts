import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeEmployeeType } from '@/lib/employee-types'

async function requireAdminOrManager() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  })

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return null
  }
  return user
}

// GET - Barcha xodimlarni olish
export async function GET(request: NextRequest) {
  try {
    const actor = await requireAdminOrManager()
    if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const employees = await prisma.user.findMany({
      where: { role: 'XODIM' },
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        employeeType: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Yangi xodim yaratish
export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminOrManager()
    if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const username = String(body?.username || '').trim()
    const name = String(body?.name || '').trim()
    const password = String(body?.password || '')
    const phone = String(body?.phone || '').trim()
    const employeeType = normalizeEmployeeType(body?.employeeType)

    if (!username || !name || !password || !employeeType) {
      return NextResponse.json(
        { error: 'Username, name, password va xodim turi majburiy' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Bu username allaqachon mavjud' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const employee = await prisma.user.create({
      data: {
        username,
        name,
        password: hashedPassword,
        phone: phone || null,
        employeeType,
        role: 'XODIM',
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        employeeType: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(
      { message: 'Xodim muvaffaqiyatli yaratildi', employee },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
