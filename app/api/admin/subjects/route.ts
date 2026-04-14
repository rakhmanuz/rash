import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasSectionAccess } from '@/lib/permissions'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const canList =
      user.role === 'ADMIN' ||
      user.role === 'MANAGER' ||
      (user.role === 'ASSISTANT_ADMIN' &&
        (await hasSectionAccess(user.id, user.role, 'groups', 'view')))
    if (!canList) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const subjects = await prisma.subject.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(subjects)
  } catch (e) {
    console.error('subjects GET', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const name = String(body?.name || '').trim()
    const sortOrder =
      typeof body?.sortOrder === 'number' && Number.isFinite(body.sortOrder)
        ? Math.floor(body.sortOrder)
        : 0

    if (!name) {
      return NextResponse.json({ error: 'Fan nomi kiritilishi kerak' }, { status: 400 })
    }

    const subject = await prisma.subject.create({
      data: { name, sortOrder, isActive: true },
    })
    return NextResponse.json(subject, { status: 201 })
  } catch (e) {
    console.error('subjects POST', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
