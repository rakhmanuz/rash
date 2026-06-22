import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function getTaskDelegate() {
  const delegate = (prisma as any).assistantAdminTask
  if (!delegate) throw new Error('PRISMA_CLIENT_OUTDATED')
  return delegate
}

async function requireAdminOrManager() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  })
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) return null
  return { session, user }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminOrManager()
    if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { completionSeen } = body || {}

    const taskDelegate = getTaskDelegate()
    const task = await taskDelegate.findUnique({
      where: { id: params.id },
      include: { assignedTo: { select: { role: true } } },
    })

    if (
      !task ||
      task.assignedById !== auth.session.user.id ||
      task.assignedTo?.role !== 'XODIM'
    ) {
      return NextResponse.json({ error: 'Topshiriq topilmadi' }, { status: 404 })
    }

    const updated = await taskDelegate.update({
      where: { id: params.id },
      data: {
        ...(typeof completionSeen === 'boolean' ? { completionSeen } : {}),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if ((error as Error).message === 'PRISMA_CLIENT_OUTDATED') {
      return NextResponse.json(
        { error: 'Prisma client yangilanmagan. `npx prisma generate` ishga tushiring.' },
        { status: 500 }
      )
    }
    console.error('Error updating xodim task:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminOrManager()
    if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const taskDelegate = getTaskDelegate()
    const task = await taskDelegate.findUnique({
      where: { id: params.id },
      include: { assignedTo: { select: { role: true } } },
    })
    if (
      !task ||
      task.assignedById !== auth.session.user.id ||
      task.assignedTo?.role !== 'XODIM'
    ) {
      return NextResponse.json({ error: 'Topshiriq topilmadi' }, { status: 404 })
    }

    await taskDelegate.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Topshiriq o‘chirildi' })
  } catch (error) {
    if ((error as Error).message === 'PRISMA_CLIENT_OUTDATED') {
      return NextResponse.json(
        { error: 'Prisma client yangilanmagan. `npx prisma generate` ishga tushiring.' },
        { status: 500 }
      )
    }
    console.error('Error deleting xodim task:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
