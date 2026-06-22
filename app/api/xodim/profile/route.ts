import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Xodim profilini olish
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        employeeType: true,
        role: true,
      },
    })
    if (!user || user.role !== 'XODIM') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching employee profile:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT - Xodim profilini yangilash
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        password: true,
      },
    })
    if (!user || user.role !== 'XODIM') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const name = String(body?.name || '').trim()
    const phone = body?.phone
    const currentPassword = String(body?.currentPassword || '')
    const newPassword = String(body?.newPassword || '')

    if (!name) {
      return NextResponse.json({ error: 'Ism bo\'sh bo\'lmasligi kerak' }, { status: 400 })
    }

    const updateData: any = {
      name,
      phone: phone === undefined ? null : String(phone || '').trim() || null,
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Joriy parol kiritilishi kerak' },
          { status: 400 }
        )
      }
      if (!user.password) {
        return NextResponse.json({ error: 'Parol topilmadi' }, { status: 400 })
      }
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Joriy parol noto\'g\'ri' }, { status: 400 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(newPassword, 10)
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        employeeType: true,
        role: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating employee profile:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
