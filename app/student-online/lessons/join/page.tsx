import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractJoinUrl } from '@/lib/online-lessons-helpers'

type Props = {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function JoinLiveLessonPage({ searchParams }: Props) {
  const raw = searchParams.scheduleId
  const scheduleId = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined
  if (!scheduleId) {
    redirect('/student-online/lessons')
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/student-online/lessons/join?scheduleId=${encodeURIComponent(scheduleId)}`)}`
    )
  }

  const schedule = await prisma.classSchedule.findUnique({
    where: { id: scheduleId },
    select: { groupId: true, notes: true, date: true },
  })

  if (!schedule) {
    redirect('/student-online/lessons')
  }

  const now = new Date()
  const fromDate = new Date(now)
  fromDate.setDate(fromDate.getDate() - 1)
  if (new Date(schedule.date) < fromDate) {
    redirect('/student-online/lessons')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { studentProfile: { select: { id: true } } },
  })

  if (!user?.studentProfile) {
    redirect('/student-online/lessons')
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: user.studentProfile.id,
      groupId: schedule.groupId,
      isActive: true,
    },
  })

  if (!enrollment) {
    redirect('/student-online/lessons')
  }

  const joinUrl = extractJoinUrl(schedule.notes)
  if (!joinUrl) {
    redirect('/student-online/lessons')
  }

  redirect(joinUrl)
}
