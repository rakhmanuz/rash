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

export function fourFromLastResults(lastResults: unknown) {
  const lr = (lastResults ?? {}) as NonNullable<LastResults>
  return {
    attendance: lr.attendance?.percentage ?? 0,
    homework: lr.homework?.percentage ?? 0,
    test: lr.test?.percentage ?? 0,
    written: lr.writtenWork?.percentage ?? 0,
  }
}

export function averageRounded(values: number[]) {
  if (!values.length) return 0
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

/** Umumiy ko'rinish: har bir guruh bo'yicha alohida lastResults o'rtachasi; qolgan maydonlar baseline (yig'indi) dan */
export function buildOverviewStatsPayload(
  baseline: Record<string, unknown>,
  perGroup: Record<string, Record<string, unknown>>,
  enrollments: Array<{ groupId: string; groupName: string; subjectName: string | null }>
) {
  const ids = enrollments.map((e) => e.groupId).filter((id) => perGroup[id])
  const rows = ids.map((id) => fourFromLastResults(perGroup[id]?.lastResults))
  const n = rows.length || 1

  const avgAtt = averageRounded(rows.map((r) => r.attendance))
  const avgHw = averageRounded(rows.map((r) => r.homework))
  const avgTest = averageRounded(rows.map((r) => r.test))
  const avgWr = averageRounded(rows.map((r) => r.written))

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
    attendanceRate: avgAtt,
    assignmentRate: avgHw,
    classMastery: avgTest,
    weeklyWrittenRate: avgWr,
    lastResults: {
      attendance: mergeMeta('attendance', avgAtt),
      homework: mergeMeta('homework', avgHw),
      test: mergeMeta('test', avgTest),
      writtenWork: mergeMeta('writtenWork', avgWr),
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

export function navScorePercent(four: ReturnType<typeof fourFromLastResults>) {
  return Math.round((four.attendance + four.homework + four.test) / 3)
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
