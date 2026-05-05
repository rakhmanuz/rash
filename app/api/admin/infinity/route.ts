import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, type PrismaTransactionClient } from '@/lib/prisma'
import { canMutateInfinityPoints, canReadInfinityManagement } from '@/lib/natijalar-read-auth'
import type { Prisma } from '@prisma/client'

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

    const [testResults, writtenWorkResults] = await Promise.all([
      prisma.testResult.findMany({
        where: { studentId: { in: studentIds } },
        select: {
          studentId: true,
          infinityAwarded: true,
          test: { select: { group: { select: { subjectId: true } } } },
        },
      }),
      prisma.writtenWorkResult.findMany({
        where: { studentId: { in: studentIds } },
        select: {
          studentId: true,
          infinityAwarded: true,
          writtenWork: { select: { group: { select: { subjectId: true } } } },
        },
      }),
    ])

    const byStudentAndSubject = new Map<string, Map<string, number>>()
    for (const studentId of studentIds) {
      byStudentAndSubject.set(studentId, new Map<string, number>())
    }

    for (const r of testResults) {
      const sid = r.test.group.subjectId
      if (!sid) continue
      const perSubject = byStudentAndSubject.get(r.studentId)
      if (!perSubject) continue
      perSubject.set(sid, (perSubject.get(sid) ?? 0) + (r.infinityAwarded ?? 0))
    }
    for (const r of writtenWorkResults) {
      const sid = r.writtenWork.group.subjectId
      if (!sid) continue
      const perSubject = byStudentAndSubject.get(r.studentId)
      if (!perSubject) continue
      perSubject.set(sid, (perSubject.get(sid) ?? 0) + (r.infinityAwarded ?? 0))
    }

    const enrichedUsers = users.map((u) => {
      const studentId = u.studentProfile?.id
      const perSubject = studentId ? byStudentAndSubject.get(studentId) : undefined
      const enrolledSubjects = new Map<string, string>()
      for (const enr of u.studentProfile?.enrollments ?? []) {
        const sub = enr.group.subject
        if (sub?.id) enrolledSubjects.set(sub.id, sub.name)
      }
      const subjectInfinityBreakdown = [...enrolledSubjects.entries()].map(([sid, sname]) => ({
        subjectId: sid,
        subjectName: sname,
        infinityPoints: perSubject?.get(sid) ?? 0,
      }))
      const scopedInfinity =
        subjectId && perSubject
          ? perSubject.get(subjectId) ?? 0
          : u.infinityPoints
      return {
        ...u,
        infinityPoints: scopedInfinity,
        subjectInfinityBreakdown,
      }
    })

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
    const { userId, amount, operation, reason } = body // operation: 'add' yoki 'subtract', reason: sabab (ixtiyoriy)

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

    if (operation === 'add') {
      newPoints = currentPoints + amount
      historyAmount = amount
    } else {
      newPoints = Math.max(0, currentPoints - amount)
      historyAmount = -amount
    }

    const actorLabel = user.role === 'RAHBAR' ? 'Rahbar' : 'Admin'
    const description =
      (reason && String(reason).trim()) ||
      (operation === 'add' ? `${actorLabel}: +${amount} ∞ qo'shildi` : `${actorLabel}: −${amount} ∞ ayirildi`)

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
        },
      })
      return u
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
