import { addDays } from 'date-fns'
import { dateKeyUzbekistan, weekBoundsUzbekistan } from '@/lib/uzbekistan-time'

export const WEEK_DAYS = [
  { uz: 'Yakshanba', short: 'Yak', dayIndex: 0 },
  { uz: 'Dushanba', short: 'Du', dayIndex: 1 },
  { uz: 'Seshanba', short: 'Se', dayIndex: 2 },
  { uz: 'Chorshanba', short: 'Cho', dayIndex: 3 },
  { uz: 'Payshanba', short: 'Pay', dayIndex: 4 },
  { uz: 'Juma', short: 'Ju', dayIndex: 5 },
  { uz: 'Shanba', short: 'Sha', dayIndex: 6 },
] as const

export type StudentScheduleRow = {
  id: string
  groupId: string
  groupName: string
  subjectName: string
  teacherName: string
  date: string
  times: string[]
  notes: string
}

export function parseScheduleTimes(raw: string | string[] | null | undefined): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map((v) => String(v)).filter(Boolean)
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((v) => String(v)).filter(Boolean)
  } catch {
    return []
  }
}

/** @deprecated — dateKeyUzbekistan ishlating */
export function dateKeyLocal(d: Date): string {
  return dateKeyUzbekistan(d)
}

export function weekBoundsFromAnchor(anchor: Date = new Date()) {
  return weekBoundsUzbekistan(anchor)
}

export function buildWeekScheduleGrid(schedules: StudentScheduleRow[], weekStart: Date) {
  const weekDaysMap: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    weekDaysMap[dateKeyUzbekistan(addDays(weekStart, i))] = i
  }

  const weekData: Record<number, Record<string, StudentScheduleRow[]>> = {}
  const allTimes = new Set<string>()

  schedules.forEach((schedule) => {
    const scheduleDate = new Date(schedule.date)
    const scheduleDateKey = dateKeyUzbekistan(scheduleDate)
    const dayKey = weekDaysMap[scheduleDateKey]
    if (dayKey === undefined) return

    if (!weekData[dayKey]) weekData[dayKey] = {}

    const times = parseScheduleTimes(schedule.times)
    times.forEach((time) => {
      allTimes.add(time)
      if (!weekData[dayKey][time]) weekData[dayKey][time] = []
      const exists = weekData[dayKey][time].some((s) => s.id === schedule.id)
      if (!exists) weekData[dayKey][time].push(schedule)
    })
  })

  const sortedTimes = Array.from(allTimes).sort((a, b) => {
    const [aHour, aMin] = a.split(':').map(Number)
    const [bHour, bMin] = b.split(':').map(Number)
    return aHour * 60 + aMin - (bHour * 60 + bMin)
  })

  return { weekData, sortedTimes }
}
