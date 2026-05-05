import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function canManageReyting(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'MANAGER'
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || !canManageReyting(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const [groups, students] = await Promise.all([
      prisma.reytingAllowedGroup.findMany({
        select: { groupId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.reytingAllowedStudent.findMany({
        select: { studentId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      allowedGroupIds: groups.map((g) => g.groupId),
      allowedStudentIds: students.map((s) => s.studentId),
    })
  } catch (error) {
    console.error('Error reading reyting access:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || !canManageReyting(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body: { allowedGroupIds?: unknown[]; allowedStudentIds?: unknown[] } = await request
      .json()
      .catch(() => ({}))
    const allowedGroupIds = Array.isArray(body.allowedGroupIds) ? body.allowedGroupIds : []
    const allowedStudentIds = Array.isArray(body.allowedStudentIds) ? body.allowedStudentIds : []

    const uniqGroupIds = Array.from(new Set(allowedGroupIds.filter(isNonEmptyString)))
    const uniqStudentIds = Array.from(new Set(allowedStudentIds.filter(isNonEmptyString)))

    await prisma.$transaction(async (tx) => {
      await tx.reytingAllowedGroup.deleteMany({})
      await tx.reytingAllowedStudent.deleteMany({})

      if (uniqGroupIds.length > 0) {
        await tx.reytingAllowedGroup.createMany({
          data: uniqGroupIds.map((groupId) => ({ groupId })),
        })
      }

      if (uniqStudentIds.length > 0) {
        await tx.reytingAllowedStudent.createMany({
          data: uniqStudentIds.map((studentId) => ({ studentId })),
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error saving reyting access:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

