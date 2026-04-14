import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function canManage(role: string | undefined) {
  return role === 'ADMIN' || role === 'MANAGER'
}

export async function POST(request: NextRequest) {
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
    const ids = Array.isArray(body?.studentIds) ? body.studentIds : []
    const clean = [...new Set(ids.filter((x: unknown) => typeof x === 'string' && x.length > 0))] as string[]
    if (clean.length === 0) {
      return NextResponse.json({ error: 'studentIds kerak' }, { status: 400 })
    }

    const students = await prisma.student.findMany({
      where: { id: { in: clean } },
      select: { id: true },
    })
    const okIds = students.map((s) => s.id)
    if (okIds.length === 0) {
      return NextResponse.json({ reset: 0 })
    }

    const attempts = await prisma.vazifaExamAttempt.findMany({
      where: { studentId: { in: okIds }, endedAt: { not: null } },
      select: { id: true, studentId: true },
    })
    const attemptIds = attempts.map((a) => a.id)

    await prisma.$transaction(async (tx) => {
      if (attemptIds.length > 0) {
        await tx.vazifaExamSubmission.deleteMany({
          where: {
            OR: [{ studentId: { in: okIds } }, { attemptId: { in: attemptIds } }],
          },
        })
        await tx.vazifaExamAttempt.deleteMany({
          where: { id: { in: attemptIds } },
        })
      } else {
        await tx.vazifaExamSubmission.deleteMany({
          where: { studentId: { in: okIds } },
        })
      }
    })

    return NextResponse.json({ reset: okIds.length })
  } catch (e) {
    console.error('admin vazifa-exam/reset-attempts POST', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
