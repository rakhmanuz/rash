import { NextResponse } from 'next/server'
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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    })
    if (!user || user.role !== 'XODIM') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const completionNote = String(body?.completionNote || '').trim()
    const completionAttachments = sanitizeAttachments(body?.completionAttachments).map((item) => ({
      ...item,
      source: 'XODIM' as const,
    }))
    if (!completionNote) {
      return NextResponse.json({ error: 'Tasdiqlash uchun izoh kiriting' }, { status: 400 })
    }

    const taskDelegate = getTaskDelegate()
    const task = await taskDelegate.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: {
          select: { role: true },
        },
      },
    })
    if (
      !task ||
      task.assignedToId !== session.user.id ||
      task.assignedTo?.role !== 'XODIM'
    ) {
      return NextResponse.json({ error: 'Topshiriq topilmadi' }, { status: 404 })
    }

    if (task.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Bu topshiriq allaqachon tasdiqlangan va qayta o‘zgartirib bo‘lmaydi.' },
        { status: 409 }
      )
    }

    const parsed = parseTaskDescription(task.description)
    const noteBlock = `[XODIM IZOHI | ${new Date().toLocaleString('uz-UZ')}]\n${completionNote}`
    const descriptionWithNote = [parsed.description, noteBlock].filter(Boolean).join('\n\n').trim()
    const nextAttachments = [...parsed.attachments, ...completionAttachments]
    const nextDescription = buildTaskDescription(descriptionWithNote, nextAttachments)

    const updated = await taskDelegate.update({
      where: { id: params.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completionSeen: false,
        description: nextDescription,
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
    console.error('Error completing xodim task:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
