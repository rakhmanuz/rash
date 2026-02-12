import { NextResponse } from 'next/server'
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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.role !== 'ASSISTANT_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const taskDelegate = getTaskDelegate()
    const task = await taskDelegate.findUnique({ where: { id: params.id } })
    if (!task || task.assignedToId !== session.user.id) {
      return NextResponse.json({ error: 'Topshiriq topilmadi' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const completed = body?.completed !== false

    const updated = await taskDelegate.update({
      where: { id: params.id },
      data: {
        status: completed ? 'COMPLETED' : 'PENDING',
        completedAt: completed ? new Date() : null,
        completionSeen: completed ? false : true,
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
    console.error('Error toggling task completion:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
