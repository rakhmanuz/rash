import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkOpenAnswer } from '@/lib/testBankOpenAnswer'

async function requireStudent() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { studentProfile: true },
  })
  if (!user || user.role !== 'STUDENT' || !user.studentProfile) return null
  return user
}

export async function POST(request: NextRequest, { params }: { params: { questionId: string } }) {
  try {
    if (!(await requireStudent())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await request.json()
    const answer = typeof body?.answer === 'string' ? body.answer : ''
    const row = await prisma.testBankOpenQuestion.findUnique({
      where: { id: params.questionId },
      select: { correctAnswer: true },
    })
    if (!row) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
    const correct = checkOpenAnswer(answer, row.correctAnswer)
    return NextResponse.json({ correct })
  } catch (e) {
    console.error('student check POST', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
