/** O'quvchi dashboard: fanlar bo'yicha o'rtacha va alohida ko'rinish (API o'zgarmaydi) */

/**
 * Qo'shimcha fanlar — ko'k / apelsin / binafsha / qizil (rasmdagi kabi).
 * Asosiy fan alohida: PRIMARY_SUBJECT_ACCENT.
 */
export const SUBJECT_CARD_PALETTE = [
  { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.22)' },
  { color: '#f97316', bg: 'rgba(249, 115, 22, 0.18)' },
  { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.18)' },
  { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.16)' },
] as const

/** Umumiy ko'rinish — qorong'u fon ustidagi 4 ta yig'indi raqami */
export const OVERVIEW_SUMMARY_ACCENTS = ['#22d3ee', '#60a5fa', '#a78bfa', '#fbbf24'] as const

/** 4 ta kichik metrika (legacy / boshqa sahifalar) */
export const METRIC_SERIES_COLORS = ['#312E81', '#4338CA', '#6366F1', '#64748B'] as const

/** Asosiy fan (birinchi yozilish) — yashil */
export const PRIMARY_SUBJECT_ACCENT = {
  color: '#10b981',
  bg: 'rgba(16, 185, 129, 0.2)',
} as const

const METRIC_COLORS_PRIMARY = ['#059669', '#10b981', '#34d399', '#64748b'] as const

const SECONDARY_METRIC_PALETTES: readonly (readonly string[])[] = [
  ['#1e40af', '#2563eb', '#60a5fa', '#64748b'],
  ['#c2410c', '#ea580c', '#fb923c', '#78716c'],
  ['#5b21b6', '#7c3aed', '#a78bfa', '#64748b'],
  ['#991b1b', '#dc2626', '#f87171', '#64748b'],
] as const

/** i = 0 → asosiy fan (yashil); qolganlari → SUBJECT_CARD_PALETTE */
export function paletteForIndex(i: number) {
  if (i === 0) return PRIMARY_SUBJECT_ACCENT
  return SUBJECT_CARD_PALETTE[(i - 1) % SUBJECT_CARD_PALETTE.length]
}

/** Fan kartasidagi 4 ta kichik metrika ranglari (enrollment indeksi bo'yicha) */
export function metricColorsForSubject(enrollmentIndex: number): readonly string[] {
  if (enrollmentIndex === 0) return METRIC_COLORS_PRIMARY
  const slot = (enrollmentIndex - 1) % SECONDARY_METRIC_PALETTES.length
  return SECONDARY_METRIC_PALETTES[slot]
}

/** Bosh sahifa — fan kartalari qatori doim shu slotlar sonida */
export const SUBJECT_OVERVIEW_SLOT_COUNT = 2

export type EnrollmentOverviewSlot = {
  groupId: string
  groupName: string
  subjectName: string | null
  isPlaceholder?: boolean
}

export function padEnrollmentOverviewSlots(
  list: Array<{ groupId: string; groupName: string; subjectName: string | null }>
): EnrollmentOverviewSlot[] {
  const result: EnrollmentOverviewSlot[] = list.slice(0, SUBJECT_OVERVIEW_SLOT_COUNT).map((e) => ({ ...e }))
  while (result.length < SUBJECT_OVERVIEW_SLOT_COUNT) {
    result.push({
      groupId: `_overview_slot_${result.length}`,
      groupName: '—',
      subjectName: null,
      isPlaceholder: true,
    })
  }
  return result
}

export function enrollmentLabel(e: {
  groupId: string
  groupName: string
  subjectName: string | null
}) {
  return e.subjectName ? `${e.subjectName}: ${e.groupName}` : e.groupName
}

export function teacherLine(e: {
  groupName: string
  subjectName: string | null
}) {
  return e.subjectName
    ? `O'qituvchi: ${e.groupName}`
    : `Guruh: ${e.groupName}`
}

type LastResults = {
  attendance?: { percentage?: number; date?: string | null; label?: string } | null
  homework?: { percentage?: number; date?: string | null; label?: string } | null
  test?: { percentage?: number; date?: string | null; label?: string } | null
  writtenWork?: { percentage?: number; date?: string | null; label?: string } | null
} | null

/** Oxirgi natija bo‘yicha 4 ko‘rsatkich; yo‘q bo‘lsa null (0 emas — kelajak/o‘tilmagan dars uchun). */
export function fourFromLastResults(lastResults: unknown) {
  const lr = (lastResults ?? {}) as NonNullable<LastResults>
  const pct = (m: { percentage?: number } | null | undefined) => {
    if (!m || typeof m.percentage !== 'number' || Number.isNaN(m.percentage)) return null
    return m.percentage
  }
  return {
    attendance: pct(lr.attendance),
    homework: pct(lr.homework),
    test: pct(lr.test),
    written: pct(lr.writtenWork),
  }
}

export function formatPercentMetric(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value}%`
}

export function averageRounded(values: number[]) {
  if (!values.length) return 0
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

/** Faqat haqiqiy (null emas) qiymatlar o‘rtachasi; hech biri bo‘lmasa null. */
export function averageRoundedNullable(values: (number | null)[]) {
  const valid = values.filter((v): v is number => v != null && !Number.isNaN(v))
  if (!valid.length) return null
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
}

/** Umumiy ko'rinish: har bir guruh bo'yicha alohida lastResults o'rtachasi; qolgan maydonlar baseline (yig'indi) dan */
export function buildOverviewStatsPayload(
  baseline: Record<string, unknown>,
  perGroup: Record<string, Record<string, unknown>>,
  enrollments: Array<{ groupId: string; groupName: string; subjectName: string | null }>
) {
  const ids = enrollments.map((e) => e.groupId).filter((id) => perGroup[id])
  const rows = ids.map((id) => fourFromLastResults(perGroup[id]?.lastResults))

  const avgAtt = averageRoundedNullable(rows.map((r) => r.attendance))
  const avgHw = averageRoundedNullable(rows.map((r) => r.homework))
  const avgTest = averageRoundedNullable(rows.map((r) => r.test))
  const avgWr = averageRoundedNullable(rows.map((r) => r.written))

  const mergeMeta = (
    key: 'attendance' | 'homework' | 'test' | 'writtenWork',
    pct: number
  ) => {
    for (const id of ids) {
      const lr = perGroup[id]?.lastResults as unknown as LastResults
      const m = lr?.[key]
      if (m && typeof m.percentage === 'number') {
        return { ...m, percentage: pct }
      }
    }
    return { percentage: pct, date: null as string | null, label: "O'rtacha" }
  }

  return {
    ...baseline,
    attendanceRate: avgAtt ?? 0,
    assignmentRate: avgHw ?? 0,
    classMastery: avgTest ?? 0,
    weeklyWrittenRate: avgWr ?? 0,
    lastResults: {
      attendance: mergeMeta('attendance', avgAtt ?? 0),
      homework: mergeMeta('homework', avgHw ?? 0),
      test: mergeMeta('test', avgTest ?? 0),
      writtenWork: mergeMeta('writtenWork', avgWr ?? 0),
    },
    statsScopeLabel: "Barcha fanlar — umumiy ko'rinish",
    statsGroupId: null,
    monthlyData: [],
    dailyData: [],
    yearlyData: [],
    yearlyDailyData: [],
    attendanceHistory: [],
  }
}

export function navScorePercent(four: ReturnType<typeof fourFromLastResults>): number | null {
  return averageRoundedNullable([four.attendance, four.homework, four.test])
}

export function resolveDisplayedPayload(
  baseline: Record<string, unknown>,
  perGroup: Record<string, Record<string, unknown>>,
  nav: 'overview' | string
) {
  const enrollments = (baseline?.enrollmentsForStats as
    | Array<{ groupId: string; groupName: string; subjectName: string | null }>
    | undefined) ?? []
  if (enrollments.length === 0) return baseline
  const hasAny = enrollments.some((e) => perGroup[e.groupId])
  if (!hasAny) return baseline
  if (nav !== 'overview' && perGroup[nav]) return perGroup[nav] as Record<string, unknown>
  return buildOverviewStatsPayload(baseline, perGroup, enrollments) as Record<string, unknown>
}
