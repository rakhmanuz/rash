import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVazifaExamSettings } from '@/lib/vazifa-exam-settings'

function canManage(role: string | undefined) {
  return role === 'ADMIN' || role === 'MANAGER'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || !canManage(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const settings = await getVazifaExamSettings()
    const allowedRows = await prisma.vazifaExamAllowedStudent.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        student: {
          include: {
            user: { select: { name: true, username: true } },
          },
        },
      },
    })

    const recentSubmissions = await prisma.vazifaExamSubmission.findMany({
      take: 80,
      orderBy: { submittedAt: 'desc' },
      include: {
        student: {
          include: {
            user: { select: { name: true, username: true } },
          },
        },
      },
    })

    return NextResponse.json({
      settings,
      allowedStudents: allowedRows.map((r) => ({
        id: r.student.id,
        studentId: r.student.studentId,
        name: r.student.user.name,
        username: r.student.user.username,
        addedAt: r.createdAt.toISOString(),
      })),
      recentSubmissions,
    })
  } catch (e) {
    console.error('admin vazifa-exam GET', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || !canManage(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Yaroqsiz so‘rov' }, { status: 400 })
    }

    const data: {
      lockdownOpen?: boolean
      title?: string
      instructions?: string
      durationMinutes?: number
    } = {}

    if (typeof body.lockdownOpen === 'boolean') {
      data.lockdownOpen = body.lockdownOpen
    }
    if (typeof body.title === 'string' && body.title.trim().length > 0) {
      data.title = body.title.trim().slice(0, 200)
    }
    if (typeof body.instructions === 'string') {
      data.instructions = body.instructions.slice(0, 8000)
    }
    if (typeof body.durationMinutes === 'number' && Number.isFinite(body.durationMinutes)) {
      const d = Math.round(body.durationMinutes)
      if (d >= 1 && d <= 240) {
        data.durationMinutes = d
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Yangilanish yoq' }, { status: 400 })
    }

    await getVazifaExamSettings()

    const settings = await prisma.vazifaExamSettings.update({
      where: { id: 'singleton' },
      data,
    })

    return NextResponse.json({ settings })
  } catch (e) {
    console.error('admin vazifa-exam PATCH', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
