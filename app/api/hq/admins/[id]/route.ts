import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSuperAdminSession } from '@/lib/super-admin'

const ALLOWED_ADMIN_ROLES = ['ADMIN', 'MANAGER', 'ASSISTANT_ADMIN'] as const

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!isSuperAdminSession(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, username, password, role, phone, isActive, assignment, permissions } = body || {}

    const existing = await prisma.user.findUnique({
      where: { id: params.id },
      include: { assistantAdminProfile: true },
    })

    if (!existing || !ALLOWED_ADMIN_ROLES.includes(existing.role as any)) {
      return NextResponse.json({ error: 'Admin topilmadi' }, { status: 404 })
    }

    if (username && username !== existing.username) {
      const dupe = await prisma.user.findUnique({ where: { username } })
      if (dupe) {
        return NextResponse.json({ error: 'Bu username band' }, { status: 400 })
      }
    }

    if (role && !ALLOWED_ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Noto‘g‘ri role' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (name) updateData.name = name
    if (username) updateData.username = username
    if (role) updateData.role = role
    if (phone !== undefined) updateData.phone = phone
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)
    if (password) updateData.password = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    })

    if (permissions !== undefined || assignment !== undefined) {
      await prisma.assistantAdmin.upsert({
        where: { userId: params.id },
        update: {
          permissions: permissions ? JSON.stringify(permissions) : existing.assistantAdminProfile?.permissions || '{}',
          notes: assignment !== undefined ? assignment : existing.assistantAdminProfile?.notes || null,
        },
        create: {
          userId: params.id,
          permissions: JSON.stringify(permissions || {}),
          notes: assignment || null,
        },
      })
    }

    return NextResponse.json({ message: 'Admin yangilandi' })
  } catch (error) {
    console.error('HQ admins PUT error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!isSuperAdminSession(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.user.findUnique({ where: { id: params.id } })
    if (!existing || !ALLOWED_ADMIN_ROLES.includes(existing.role as any)) {
      return NextResponse.json({ error: 'Admin topilmadi' }, { status: 404 })
    }

    await prisma.user.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Admin ochirildi' })
  } catch (error) {
    console.error('HQ admins DELETE error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
