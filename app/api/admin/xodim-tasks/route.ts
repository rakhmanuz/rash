import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  buildTaskDescription,
  parseTaskDescription,
  sanitizeAttachments,
} from '@/lib/task-attachments'

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

// GET - Admin yuborgan xodim topshiriqlari
export async function GET() {
  try {
    const auth = await requireAdminOrManager()
    if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const taskDelegate = getTaskDelegate()
    const rawTasks = await taskDelegate.findMany({
      where: {
        assignedById: auth.session.user.id,
        assignedTo: { role: 'XODIM' },
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, username: true },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })

    const tasks = rawTasks.map((task: any) => {
      const parsed = parseTaskDescription(task.description)
      return {
        ...task,
        description: parsed.description || null,
        attachments: parsed.attachments,
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    if ((error as Error).message === 'PRISMA_CLIENT_OUTDATED') {
      return NextResponse.json(
        { error: 'Prisma client yangilanmagan. `npx prisma generate` ishga tushiring.' },
        { status: 500 }
      )
    }
    console.error('Error fetching xodim tasks:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Xodimlarga topshiriq berish
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminOrManager()
    if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { title, description, dueDate, assignedToId, assignedToIds, attachments } = body || {}
    const receiverIds = Array.isArray(assignedToIds)
      ? assignedToIds.filter(Boolean)
      : assignedToId
      ? [assignedToId]
      : []

    if (!title || receiverIds.length === 0) {
      return NextResponse.json(
        { error: 'Topshiriq nomi va kamida bitta xodim tanlash majburiy' },
        { status: 400 }
      )
    }

    const xodimlar = await prisma.user.findMany({
      where: { id: { in: receiverIds } },
      select: { id: true, role: true, isActive: true },
    })
    const validXodimlar = xodimlar.filter((x) => x.role === 'XODIM' && x.isActive)
    if (validXodimlar.length !== receiverIds.length) {
      return NextResponse.json({ error: 'Noto‘g‘ri xodim tanlandi' }, { status: 400 })
    }

    const finalAttachments = sanitizeAttachments(attachments).map((item) => ({
      ...item,
      source: 'ADMIN' as const,
    }))
    const finalDescription = buildTaskDescription(
      description ? String(description).trim() : '',
      finalAttachments
    )

    const taskDelegate = getTaskDelegate()
    const created = await prisma.$transaction(
      validXodimlar.map((xodim) =>
        taskDelegate.create({
          data: {
            title: String(title).trim(),
            description: finalDescription || null,
            dueDate: dueDate ? new Date(dueDate) : null,
            assignedById: auth.session.user.id,
            assignedToId: xodim.id,
            status: 'PENDING',
            completionSeen: true,
          },
          include: {
            assignedTo: {
              select: { id: true, name: true, username: true },
            },
          },
        })
      )
    )

    const tasks = created.map((task: any) => {
      const parsed = parseTaskDescription(task.description)
      return {
        ...task,
        description: parsed.description || null,
        attachments: parsed.attachments,
      }
    })

    return NextResponse.json(
      {
        message: `${created.length} ta xodimga topshiriq yuborildi`,
        count: tasks.length,
        tasks,
      },
      { status: 201 }
    )
  } catch (error) {
    if ((error as Error).message === 'PRISMA_CLIENT_OUTDATED') {
      return NextResponse.json(
        { error: 'Prisma client yangilanmagan. `npx prisma generate` ishga tushiring.' },
        { status: 500 }
      )
    }
    console.error('Error creating xodim task:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
