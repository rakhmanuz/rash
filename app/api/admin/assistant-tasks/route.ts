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

export async function GET() {
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
    const tasks = await taskDelegate.findMany({
      where: { assignedById: session.user.id },
      include: {
        assignedTo: {
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
    console.error('Error fetching assistant tasks:', error)
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
    const { title, description, dueDate, assignedToId, assignedToIds } = body || {}
    const receiverIds = Array.isArray(assignedToIds)
      ? assignedToIds.filter(Boolean)
      : assignedToId
      ? [assignedToId]
      : []

    if (!title || receiverIds.length === 0) {
      return NextResponse.json(
        { error: 'Topshiriq nomi va kamida bitta yordamchi admin tanlash majburiy' },
        { status: 400 }
      )
    }

    const assistants = await prisma.user.findMany({
      where: {
        id: { in: receiverIds },
      },
      select: { id: true, role: true, isActive: true, name: true, username: true },
    })

    const validAssistants = assistants.filter(
      (assistant) => assistant.role === 'ASSISTANT_ADMIN' && assistant.isActive
    )

    if (validAssistants.length !== receiverIds.length) {
      return NextResponse.json({ error: 'Noto‘g‘ri yordamchi admin tanlandi' }, { status: 400 })
    }

    const taskDelegate = getTaskDelegate()
    const createdTasks = await prisma.$transaction(
      validAssistants.map((assistant) =>
        taskDelegate.create({
          data: {
            title: String(title).trim(),
            description: description ? String(description).trim() : null,
            dueDate: dueDate ? new Date(dueDate) : null,
            assignedById: session.user.id,
            assignedToId: assistant.id,
          },
          include: {
            assignedTo: {
              select: { id: true, name: true, username: true },
            },
          },
        })
      )
    )

    return NextResponse.json(
      {
        message: `${createdTasks.length} ta yordamchi adminga topshiriq yuborildi`,
        count: createdTasks.length,
        tasks: createdTasks,
      },
      { status: 201 }
    )
  } catch (error) {
    if ((error as Error)?.message === 'PRISMA_CLIENT_OUTDATED') {
      return NextResponse.json(
        { error: 'Prisma client yangilanmagan. `npx prisma generate` ishga tushiring.' },
        { status: 500 }
      )
    }
    console.error('Error creating assistant task:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
