import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Dars rejasidagi birinchi slot vaqti (HH:mm) — timezone siljishisiz UI uchun */
function getScheduledLessonStart(
  classSchedule: { date: Date; times: string } | null | undefined
): string | null {
  if (!classSchedule) return null
  try {
    const scheduleTimes =
      typeof classSchedule.times === 'string'
        ? JSON.parse(classSchedule.times)
        : classSchedule.times
    if (!Array.isArray(scheduleTimes) || scheduleTimes.length === 0) return null
    const firstTime = scheduleTimes[0]
    const [hours, minutes] = String(firstTime).split(':').map(Number)
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  } catch {
    return null
  }
}

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
      include: {
        studentProfile: {
          include: {
            enrollments: {
              include: {
                group: {
                  include: {
                    subject: { select: { name: true } },
                    classSchedules: {
                      orderBy: {
                        date: 'asc',
                      },
                    },
                  },
                },
              },
              where: {
                isActive: true,
              },
            },
            attendances: {
              include: {
                classSchedule: true,
              },
              orderBy: {
                date: 'desc',
              },
            },
          },
        },
      },
    })

    if (!user || !user.studentProfile) {
      return NextResponse.json({
        attendances: [],
        missingClasses: [],
        enrollmentDate: null,
        groupsMeta: [],
      })
    }

    const student = user.studentProfile

    const activeEnrollments = student.enrollments.filter(e => e.isActive)

    if (activeEnrollments.length === 0) {
      return NextResponse.json({
        attendances: [],
        missingClasses: [],
        enrollmentDate: null,
        groupsMeta: [],
      })
    }

    /** Har bir guruh uchun alohida yozilgan sana — ko‘p guruhda “birinchi” guruh boshlanishi noto‘g‘ri bo‘lmasin */
    const enrollmentStartByGroupId = new Map<string, Date>()
    for (const e of activeEnrollments) {
      const d = new Date(e.enrolledAt)
      d.setHours(0, 0, 0, 0)
      enrollmentStartByGroupId.set(e.groupId, d)
    }
    const earliestEnrollment = new Date(
      Math.min(...activeEnrollments.map((e) => new Date(e.enrolledAt).getTime()))
    )
    earliestEnrollment.setHours(0, 0, 0, 0)

    // Get all active groups with class schedules
    const activeGroups = activeEnrollments.map(e => ({
      id: e.group.id,
      name: e.group.name,
      subjectName: e.group.subject?.name ?? null,
      classSchedules: e.group.classSchedules || [],
    }))

    // Guruh nomlari: faol guruhlar + davomatda ishlatilgan barcha groupId (guruh almashtirganda eski guruh)
    const groupMap = new Map<string, string>(
      activeGroups.map(g => [g.id, g.name])
    )
    const attendanceGroupIds = [...new Set(student.attendances.map(a => a.groupId))]
    const groupIdsToResolve = attendanceGroupIds.filter(id => !groupMap.has(id))
    const subjectNameByGroupId = new Map<string, string | null>()
    for (const e of activeEnrollments) {
      subjectNameByGroupId.set(e.groupId, e.group.subject?.name ?? null)
    }
    if (groupIdsToResolve.length > 0) {
      const extraGroups = await prisma.group.findMany({
        where: { id: { in: groupIdsToResolve } },
        select: { id: true, name: true, subject: { select: { name: true } } },
      })
      for (const g of extraGroups) {
        groupMap.set(g.id, g.name)
        subjectNameByGroupId.set(g.id, g.subject?.name ?? null)
      }
    }

    const getPctEarly = (isPresent: boolean, lateMinutes: number | null) => {
      if (!isPresent) return 0
      const late = lateMinutes ?? 0
      return Math.round(Math.max(0, Math.min(100, ((180 - late) / 180) * 100)))
    }
    if (activeGroups.length === 0) {
      const UZ_OFF = 5 * 60 * 60 * 1000
      const endToday = new Date()
      endToday.setHours(23, 59, 59, 999)
      const fromAbsences = student.attendances
        .filter(a => !a.isPresent && new Date(a.date) <= endToday)
        .map(a => {
          const uzDate = new Date(a.date.getTime() + UZ_OFF)
          const gid = a.groupId
          return {
            groupId: gid,
            date: a.date.toISOString(),
            dayOfWeek: uzDate.toLocaleDateString('uz-UZ', { weekday: 'long' }),
            groupName: groupMap.get(gid) || 'Noma\'lum guruh',
            subjectName: subjectNameByGroupId.get(gid) ?? null,
          }
        })
      fromAbsences.sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime())
      const groupsMetaEarly = activeEnrollments.map((e, i) => ({
        groupId: e.groupId,
        groupName: e.group.name,
        subjectName: e.group.subject?.name ?? null,
        sortIndex: i,
      }))
      return NextResponse.json({
        attendances: student.attendances.map(a => ({
          id: a.id,
          date: a.date.toISOString(),
          isPresent: a.isPresent,
          lateMinutes: (a as any).lateMinutes ?? null,
          attendancePercentage: getPctEarly(a.isPresent, (a as any).lateMinutes ?? null),
          lessonTime: getScheduledLessonStart(a.classSchedule),
          notes: a.notes,
          group: {
            id: a.groupId,
            name: groupMap.get(a.groupId) || 'Noma\'lum guruh',
            subjectName: subjectNameByGroupId.get(a.groupId) ?? null,
          },
        })),
        missingClasses: fromAbsences,
        enrollmentDate: earliestEnrollment.toISOString(),
        groupsMeta: groupsMetaEarly,
      })
    }

    // O'zbekiston vaqti (UTC+5)
    const UZBEKISTAN_OFFSET = 5 * 60 * 60 * 1000
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    // Get all class schedules for active groups (only past and today)
    const allClassSchedules: Array<{ id: string; date: Date; groupId: string; groupName: string }> = []
    
    activeGroups.forEach(group => {
      const groupStart =
        enrollmentStartByGroupId.get(group.id) ?? earliestEnrollment
      group.classSchedules.forEach(classSchedule => {
        const scheduleDate = new Date(classSchedule.date)
        if (scheduleDate >= groupStart && scheduleDate <= today) {
          allClassSchedules.push({
            id: classSchedule.id,
            date: scheduleDate,
            groupId: group.id,
            groupName: group.name,
          })
        }
      })
    })

    // Sort by date
    allClassSchedules.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Get all class schedule IDs that have attendance records
    const attendedClassScheduleIds = new Set(
      student.attendances
        .filter(a => a.classScheduleId)
        .map(a => a.classScheduleId!)
    )

    // Kelmagan darslar: (1) o'qituvchi "Kelmadi" deb belgilaganlar — barcha hafta kunlari;
    // (2) dars rejasi bor, lekin davomat umuman yozilmagan slotlar (oldingi mantiq).
    // Eslatma: attendedClassScheduleIds da isPresent:false ham bor, shuning uchun (2) faqat
    // hech yozuv bo'lmagan sanalarni beradi; (1) buni to'ldiradi.
    const fromExplicitAbsences = student.attendances
      .filter(a => !a.isPresent && new Date(a.date) <= today)
      .map(a => {
        const uzDate = new Date(a.date.getTime() + UZBEKISTAN_OFFSET)
        return {
          key: a.classScheduleId ?? a.id,
          groupId: a.groupId,
          date: a.date.toISOString(),
          dayOfWeek: uzDate.toLocaleDateString('uz-UZ', { weekday: 'long' }),
          groupName: groupMap.get(a.groupId) || 'Noma\'lum guruh',
          subjectName: subjectNameByGroupId.get(a.groupId) ?? null,
        }
      })
    const explicitBySchedule = new Map<string, (typeof fromExplicitAbsences)[0]>()
    for (const row of fromExplicitAbsences) {
      if (!explicitBySchedule.has(row.key)) {
        explicitBySchedule.set(row.key, row)
      }
    }
    const explicitMissingList = Array.from(explicitBySchedule.values()).map(
      ({ key: _k, ...rest }) => rest
    )

    const implicitMissingList = allClassSchedules
      .filter(cs => !attendedClassScheduleIds.has(cs.id))
      .map(cs => {
        const uzDate = new Date(cs.date.getTime() + UZBEKISTAN_OFFSET)
        return {
          groupId: cs.groupId,
          date: cs.date.toISOString(),
          dayOfWeek: uzDate.toLocaleDateString('uz-UZ', { weekday: 'long' }),
          groupName: cs.groupName,
          subjectName: subjectNameByGroupId.get(cs.groupId) ?? null,
        }
      })

    const missingClasses = [...explicitMissingList, ...implicitMissingList].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const LESSON_DURATION_MINUTES = 180
    const getPct = (isPresent: boolean, lateMinutes: number | null) => {
      if (!isPresent) return 0
      const late = lateMinutes ?? 0
      return Math.round(Math.max(0, Math.min(100, ((LESSON_DURATION_MINUTES - late) / LESSON_DURATION_MINUTES) * 100)))
    }

    const formattedAttendances = student.attendances.map(a => ({
      id: a.id,
      date: a.date.toISOString(),
      isPresent: a.isPresent,
      lateMinutes: (a as any).lateMinutes ?? null,
      attendancePercentage: getPct(a.isPresent, (a as any).lateMinutes ?? null),
      lessonTime: getScheduledLessonStart(a.classSchedule),
      notes: a.notes,
      group: {
        id: a.groupId,
        name: groupMap.get(a.groupId) || 'Noma\'lum guruh',
        subjectName: subjectNameByGroupId.get(a.groupId) ?? null,
      },
    }))

    const groupsMeta = activeEnrollments.map((e, i) => ({
      groupId: e.groupId,
      groupName: e.group.name,
      subjectName: e.group.subject?.name ?? null,
      sortIndex: i,
    }))
    const metaGroupIds = new Set(groupsMeta.map((g) => g.groupId))
    for (const gid of attendanceGroupIds) {
      if (!metaGroupIds.has(gid)) {
        metaGroupIds.add(gid)
        groupsMeta.push({
          groupId: gid,
          groupName: groupMap.get(gid) || 'Noma\'lum guruh',
          subjectName: subjectNameByGroupId.get(gid) ?? null,
          sortIndex: 800 + metaGroupIds.size,
        })
      }
    }

    return NextResponse.json({
      attendances: formattedAttendances,
      missingClasses,
      enrollmentDate: earliestEnrollment.toISOString(),
      groupsMeta,
    })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
