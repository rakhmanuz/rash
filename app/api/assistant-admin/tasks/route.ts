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

export async function GET() {
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
    const tasks = await taskDelegate.findMany({
      where: { assignedToId: session.user.id },
      include: {
        assignedBy: {
          select: { id: true, name: true, username: true },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    if ((error as Error)?.message === 'PRISMA_CLIENT_OUTDATED') {
      return NextResponse.json(
        { error: 'Prisma client yangilanmagan. `npx prisma generate` ishga tushiring.' },
        { status: 500 }
      )
    }
    console.error('Error fetching assistant admin tasks:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
