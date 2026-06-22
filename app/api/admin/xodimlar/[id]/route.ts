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

// GET - Xodimni olish (batafsil)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await requireAdminOrManager()
    if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const employee = await prisma.user.findUnique({
      where: { id: params.id },
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

    if (!employee || employee.role !== 'XODIM') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT - Xodimni yangilash
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await requireAdminOrManager()
    if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const existing = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, username: true, role: true },
    })
    if (!existing || existing.role !== 'XODIM') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const username = String(body?.username || '').trim()
    const name = String(body?.name || '').trim()
    const phoneRaw = body?.phone
    const employeeType = normalizeEmployeeType(body?.employeeType)
    const isActive = body?.isActive
    const password = String(body?.password || '')

    if (!username || !name || !employeeType) {
      return NextResponse.json(
        { error: 'Username, name va xodim turi majburiy' },
        { status: 400 }
      )
    }

    if (username !== existing.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      })
      if (usernameExists) {
        return NextResponse.json(
          { error: 'Bu username allaqachon mavjud' },
          { status: 400 }
        )
      }
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' },
        { status: 400 }
      )
    }

    const updateData: any = {
      username,
      name,
      phone: phoneRaw === undefined ? null : String(phoneRaw || '').trim() || null,
      employeeType,
    }
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive
    }
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({
      message: 'Xodim ma\'lumotlari yangilandi',
      employee: updated,
    })
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - Xodimni o'chirish
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await requireAdminOrManager()
    if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const existing = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, role: true },
    })
    if (!existing || existing.role !== 'XODIM') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.user.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Xodim o\'chirildi' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
