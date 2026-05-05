import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeLearningMode } from '@/lib/learning-mode'

async function isStudentAllowed(userId: string): Promise<boolean> {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: {
      id: true,
      enrollments: {
        where: { isActive: true },
        select: { groupId: true },
      },
    },
  })
  if (!student) return false

  const [direct, byGroup] = await Promise.all([
    prisma.reytingAllowedStudent.findUnique({ where: { studentId: student.id }, select: { id: true } }),
    prisma.reytingAllowedGroup.findFirst({
      where: { groupId: { in: student.enrollments.map((e) => e.groupId) } },
      select: { id: true },
    }),
  ])

  return Boolean(direct || byGroup)
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ allowed: false }, { status: 200 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, learningMode: true },
    })
    if (!user || user.role !== 'STUDENT') return NextResponse.json({ allowed: false }, { status: 200 })

    if (normalizeLearningMode(user.learningMode) === 'ONLINE') {
      return NextResponse.json({ allowed: true }, { status: 200 })
    }

    const allowed = await isStudentAllowed(session.user.id)
    return NextResponse.json({ allowed }, { status: 200 })
  } catch (error) {
    console.error('Error checking reyting access:', error)
    return NextResponse.json({ allowed: false }, { status: 200 })
  }
}

