import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function getTaskDelegate() {
  const delegate = (prisma as any).assistantAdminTask
  if (!delegate) {
    throw new Error('PRISMA_CLIENT_OUTDATED')
  }
  return delegate
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const body = await request.json()
    const { title, description, dueDate, status, completionSeen } = body || {}

    const taskDelegate = getTaskDelegate()
    const task = await taskDelegate.findUnique({ where: { id: params.id } })
    if (!task || task.assignedById !== session.user.id) {
      return NextResponse.json({ error: 'Topshiriq topilmadi' }, { status: 404 })
    }

    const updated = await taskDelegate.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined ? { title: String(title).trim() } : {}),
        ...(description !== undefined ? { description: description ? String(description).trim() : null } : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        ...(status === 'PENDING' || status === 'COMPLETED'
          ? {
              status,
              completedAt: status === 'COMPLETED' ? new Date() : null,
              completionSeen: status === 'COMPLETED' ? false : true,
            }
          : {}),
        ...(typeof completionSeen === 'boolean' ? { completionSeen } : {}),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if ((error as Error)?.message === 'PRISMA_CLIENT_OUTDATED') {
      return NextResponse.json(
        { error: 'Prisma client yangilanmagan. `npx prisma generate` ishga tushiring.' },
        { status: 500 }
      )
    }
    console.error('Error updating assistant task:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const taskDelegate = getTaskDelegate()
    const task = await taskDelegate.findUnique({ where: { id: params.id } })
    if (!task || task.assignedById !== session.user.id) {
      return NextResponse.json({ error: 'Topshiriq topilmadi' }, { status: 404 })
    }

    await taskDelegate.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Topshiriq o‘chirildi' })
  } catch (error) {
    if ((error as Error)?.message === 'PRISMA_CLIENT_OUTDATED') {
      return NextResponse.json(
        { error: 'Prisma client yangilanmagan. `npx prisma generate` ishga tushiring.' },
        { status: 500 }
      )
    }
    console.error('Error deleting assistant task:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
