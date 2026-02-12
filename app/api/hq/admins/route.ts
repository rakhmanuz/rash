import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSuperAdminSession } from '@/lib/super-admin'

const ALLOWED_ADMIN_ROLES = ['ADMIN', 'MANAGER', 'ASSISTANT_ADMIN'] as const

function defaultPermissions() {
  return {
    students: { view: false, create: false, edit: false, delete: false },
    teachers: { view: false, create: false, edit: false, delete: false },
    groups: { view: false, create: false, edit: false, delete: false },
    schedules: { view: false, create: false, edit: false, delete: false },
    tests: { view: false, create: false, edit: false, delete: false },
    payments: { view: false, create: false, edit: false, delete: false },
    market: { view: false, create: false, edit: false, delete: false },
    reports: { view: false },
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!isSuperAdminSession(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admins = await prisma.user.findMany({
      where: { role: { in: [...ALLOWED_ADMIN_ROLES] } },
      include: { assistantAdminProfile: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      admins.map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
        assignment: user.assistantAdminProfile?.notes || '',
        permissions: user.assistantAdminProfile?.permissions ? JSON.parse(user.assistantAdminProfile.permissions) : defaultPermissions(),
      }))
    )
  } catch (error) {
    console.error('HQ admins GET error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!isSuperAdminSession(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { username, name, password, role, phone, assignment, permissions } = body || {}

    if (!username || !name || !password || !role) {
      return NextResponse.json({ error: 'username, name, password va role majburiy' }, { status: 400 })
    }

    if (!ALLOWED_ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Noto‘g‘ri role' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Bu username allaqachon bor' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const created = await prisma.user.create({
      data: {
        username,
        name,
        password: hashedPassword,
        role,
        phone: phone || null,
        isActive: true,
      },
    })

    await prisma.assistantAdmin.upsert({
      where: { userId: created.id },
      update: {
        permissions: JSON.stringify(permissions || defaultPermissions()),
        notes: assignment || null,
      },
      create: {
        userId: created.id,
        permissions: JSON.stringify(permissions || defaultPermissions()),
        notes: assignment || null,
      },
    })

    return NextResponse.json({ message: 'Admin yaratildi', id: created.id }, { status: 201 })
  } catch (error) {
    console.error('HQ admins POST error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
