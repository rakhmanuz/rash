import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const name = body?.name != null ? String(body.name).trim() : undefined
    const sortOrder =
      typeof body?.sortOrder === 'number' && Number.isFinite(body.sortOrder)
        ? Math.floor(body.sortOrder)
        : undefined
    const isActive = typeof body?.isActive === 'boolean' ? body.isActive : undefined

    if (name !== undefined && !name) {
      return NextResponse.json({ error: "Fan nomi bo'sh bo'lmasligi kerak" }, { status: 400 })
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('subjects PUT', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await prisma.group.updateMany({
      where: { subjectId: id },
      data: { subjectId: null },
    })
    await prisma.subject.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('subjects DELETE', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
