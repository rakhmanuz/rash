import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, type PrismaTransactionClient } from '@/lib/prisma'
import { canMutateInfinityPoints, canReadInfinityManagement } from '@/lib/natijalar-read-auth'
import type { Prisma } from '@prisma/client'
import { logActivityForUser } from '@/lib/activity-log'
import {
  getAvailableForSubject,
  getStudentSubjectInfinityBreakdown,
} from '@/lib/subject-infinity'

// GET - Barcha foydalanuvchilar va ularning infinity ballari
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !canReadInfinityManagement(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const subjectId = searchParams.get('subjectId')

    const studentEnrollmentFilter: Prisma.EnrollmentWhereInput | undefined =
      groupId || subjectId
        ? {
            isActive: true,
            ...(groupId ? { groupId } : {}),
            ...(subjectId ? { group: { subjectId } } : {}),
          }
        : undefined

    // Guruh/fan bo'yicha filtrlash: faqat mos guruhlarga biriktirilgan o'quvchilar
    const whereClause: Prisma.UserWhereInput | undefined = studentEnrollmentFilter
      ? {
          studentProfile: {
            enrollments: {
              some: {
                ...studentEnrollmentFilter,
              },
            },
          },
        }
      : undefined

    // Barcha foydalanuvchilarni olish (infinity ballari bilan)
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        phone: true,
        infinityPoints: true,
        isActive: true,
        studentProfile: {
          select: {
            id: true,
            studentId: true,
            enrollments: {
              where: { isActive: true },
              select: {
                group: {
                  select: {
                    subject: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        teacherProfile: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        infinityPoints: 'desc',
      },
    })

    const studentIds = users
      .map((u) => u.studentProfile?.id)
      .filter((id): id is string => Boolean(id))

    if (studentIds.length === 0) {
      return NextResponse.json(users)
    }

    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const studentId = u.studentProfile?.id
        const enrolledSubjects = new Map<string, string>()
        for (const enr of u.studentProfile?.enrollments ?? []) {
          const sub = enr.group.subject
          if (sub?.id) enrolledSubjects.set(sub.id, sub.name)
        }
        const subjectInfinityBreakdown =
          studentId && enrolledSubjects.size > 0
            ? await getStudentSubjectInfinityBreakdown(prisma, {
                userId: u.id,
                studentId,
                enrolledSubjects,
                totalWallet: u.infinityPoints ?? 0,
              })
            : []
        return {
          ...u,
          infinityPoints: u.infinityPoints,
          subjectInfinityBreakdown,
        }
      })
    )

    return NextResponse.json(enrichedUsers)
  } catch (error) {
    console.error('Error fetching infinity points:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// POST - Infinity ballarini qo'shish yoki ayirish
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !canMutateInfinityPoints(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, amount, operation, reason, subjectId, subjectName } = body // operation: 'add' yoki 'subtract'

    if (!userId || amount === undefined || !operation) {
      return NextResponse.json(
        { error: 'User ID, amount, and operation are required' },
        { status: 400 }
      )
    }

    if (operation !== 'add' && operation !== 'subtract') {
      return NextResponse.json(
        { error: 'Operation must be "add" or "subtract"' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Foydalanuvchini topish
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const currentPoints = targetUser.infinityPoints || 0
    let newPoints: number
    let historyAmount: number
    const source = operation === 'add' ? 'ADMIN_ADD' : 'ADMIN_SUBTRACT'
    const resolvedSubjectId = subjectId ? String(subjectId) : null

    if (operation === 'subtract' && resolvedSubjectId) {
      const studentProfile = await prisma.student.findUnique({
        where: { userId },
        select: {
          id: true,
          enrollments: {
            where: { isActive: true },
            select: {
              group: { select: { subject: { select: { id: true, name: true } } } },
            },
          },
        },
      })
      if (studentProfile?.id) {
        const enrolledSubjects = new Map<string, string>()
        for (const enr of studentProfile.enrollments) {
          const sub = enr.group.subject
          if (sub?.id) enrolledSubjects.set(sub.id, sub.name)
        }
        if (enrolledSubjects.has(resolvedSubjectId)) {
          const breakdown = await getStudentSubjectInfinityBreakdown(prisma, {
            userId,
            studentId: studentProfile.id,
            enrolledSubjects,
            totalWallet: currentPoints,
          })
          const available = getAvailableForSubject(breakdown, resolvedSubjectId)
          if (amount > available) {
            const fanLabel =
              subjectName && String(subjectName).trim()
                ? String(subjectName).trim()
                : enrolledSubjects.get(resolvedSubjectId) ?? 'Fan'
            return NextResponse.json(
              {
                error: `${fanLabel} fanidan mavjud: ${available} ∞, ayirish: ${amount} ∞. Umumiy balans: ${currentPoints} ∞`,
              },
              { status: 400 }
            )
          }
        }
      }
    }

    if (operation === 'add') {
      newPoints = currentPoints + amount
      historyAmount = amount
    } else {
      newPoints = Math.max(0, currentPoints - amount)
      historyAmount = -amount
    }

    const actorLabel = user.role === 'RAHBAR' ? 'Rahbar' : 'Admin'
    const subjectLabel =
      subjectName && String(subjectName).trim()
        ? String(subjectName).trim()
        : subjectId
          ? await prisma.subject
              .findUnique({ where: { id: String(subjectId) }, select: { name: true } })
              .then((s) => s?.name ?? null)
          : null
    const subjectSuffix = subjectLabel ? ` · fan: ${subjectLabel}` : ''
    const defaultDescription =
      operation === 'add'
        ? `${actorLabel}: +${amount} ∞ qo'shildi${subjectSuffix}`
        : `${actorLabel}: −${amount} ∞ ayirildi${subjectSuffix}`
    const description = (reason && String(reason).trim()) || defaultDescription

    const updatedUser = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: { infinityPoints: newPoints },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          infinityPoints: true,
          studentProfile: { select: { studentId: true } },
        },
      })
      await tx.infinityHistory.create({
        data: {
          userId,
          amount: historyAmount,
          balanceAfter: newPoints,
          source,
          description,
          subjectId: operation === 'subtract' ? resolvedSubjectId : null,
        },
      })
      return u
    })

    await logActivityForUser(prisma, user, {
      action: 'ADJUST',
      category: 'infinity',
      summary: `${targetUser.name}: ${description}`,
      entityType: 'user',
      entityId: userId,
      metadata: { operation, amount, previousPoints: currentPoints, newPoints },
    })

    return NextResponse.json({
      message: `Infinity ballar ${operation === 'add' ? 'qo\'shildi' : 'ayirildi'}`,
      user: updatedUser,
      previousPoints: currentPoints,
      newPoints: newPoints,
    })
  } catch (error) {
    console.error('Error updating infinity points:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
