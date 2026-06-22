import type { PrismaClient } from '@prisma/client'

export type SubjectInfinityRow = {
  subjectId: string
  subjectName: string
  /** Fan bo'yicha sarflash mumkin bo'lgan balans */
  infinityPoints: number
  /** Test/yozmadan yig'ilgan (tarixiy) */
  earnedPoints: number
  /** Shu fandan sarflangan */
  spentPoints: number
}

const DEBIT_SOURCES = new Set(['MARKET_ORDER', 'ADMIN_SUBTRACT', 'ADMIN_RESET'])

const MATHEMATICS_KEYWORDS = ['matematika', 'math', 'algebra', 'geometriya']
let infinityHistoryHasSubjectIdCache: boolean | null = null

async function hasInfinityHistorySubjectId(prisma: PrismaClient): Promise<boolean> {
  if (infinityHistoryHasSubjectIdCache !== null) return infinityHistoryHasSubjectIdCache
  try {
    const rows = (await prisma.$queryRawUnsafe(
      "PRAGMA table_info('InfinityHistory')"
    )) as Array<{ name?: string }>
    infinityHistoryHasSubjectIdCache = rows.some((r) => String(r?.name || '') === 'subjectId')
  } catch {
    infinityHistoryHasSubjectIdCache = false
  }
  return infinityHistoryHasSubjectIdCache
}

export function isMathematicsSubject(name: string | null | undefined): boolean {
  const normalized = String(name || '').toLowerCase()
  return MATHEMATICS_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

export function findMathematicsSubjectId(enrolledSubjects: Map<string, string>): string | null {
  for (const [id, name] of enrolledSubjects) {
    if (isMathematicsSubject(name)) return id
  }
  return null
}

type HistoryDebitRow = {
  amount: number
  source: string
  description: string | null
  subjectId: string | null
}

/** Eski tarix yozuvlarida fan bo'yicha sarflanganini aniqlash */
export function inferDebitSubjectId(
  row: HistoryDebitRow,
  enrolledSubjects: Map<string, string>
): string | null {
  if (row.amount >= 0) return null
  if (row.subjectId && enrolledSubjects.has(row.subjectId)) return row.subjectId

  const desc = row.description || ''

  const fanMatch = desc.match(/fan:\s*([^·\n]+)/i)
  if (fanMatch) {
    const needle = fanMatch[1].trim().toLowerCase()
    for (const [id, name] of enrolledSubjects) {
      const n = name.toLowerCase()
      if (n === needle || n.includes(needle) || needle.includes(n)) return id
    }
  }

  if (row.source === 'MARKET_ORDER') {
    if (/matematika/i.test(desc)) {
      return findMathematicsSubjectId(enrolledSubjects)
    }
    return findMathematicsSubjectId(enrolledSubjects)
  }

  if (enrolledSubjects.size === 1) {
    return enrolledSubjects.keys().next().value ?? null
  }

  return null
}

export function sumDebitsPerSubject(
  history: HistoryDebitRow[],
  enrolledSubjects: Map<string, string>
): Map<string, number> {
  const spent = new Map<string, number>()
  for (const sid of enrolledSubjects.keys()) spent.set(sid, 0)

  for (const row of history) {
    if (row.amount >= 0 || !DEBIT_SOURCES.has(row.source)) continue
    const debit = Math.abs(row.amount)
    const sid = inferDebitSubjectId(row, enrolledSubjects)
    if (!sid) continue
    spent.set(sid, (spent.get(sid) ?? 0) + debit)
  }
  return spent
}

export async function loadSubjectEarned(
  prisma: PrismaClient,
  studentId: string,
  enrolledSubjectIds: Iterable<string>
): Promise<Map<string, number>> {
  const ids = [...enrolledSubjectIds]
  const earned = new Map<string, number>()
  for (const sid of ids) earned.set(sid, 0)
  if (ids.length === 0) return earned

  const [testResults, writtenWorkResults] = await Promise.all([
    prisma.testResult.findMany({
      where: { studentId },
      select: {
        infinityAwarded: true,
        test: { select: { group: { select: { subjectId: true } } } },
      },
    }),
    prisma.writtenWorkResult.findMany({
      where: { studentId },
      select: {
        infinityAwarded: true,
        writtenWork: { select: { group: { select: { subjectId: true } } } },
      },
    }),
  ])

  for (const r of testResults) {
    const sid = r.test.group.subjectId
    if (!sid || !earned.has(sid)) continue
    earned.set(sid, (earned.get(sid) ?? 0) + (r.infinityAwarded ?? 0))
  }
  for (const r of writtenWorkResults) {
    const sid = r.writtenWork.group.subjectId
    if (!sid || !earned.has(sid)) continue
    earned.set(sid, (earned.get(sid) ?? 0) + (r.infinityAwarded ?? 0))
  }
  return earned
}

async function loadSubjectAdminAdds(
  prisma: PrismaClient,
  userId: string,
  enrolledSubjects: Map<string, string>
): Promise<Map<string, number>> {
  const bySubject = new Map<string, number>()
  for (const sid of enrolledSubjects.keys()) bySubject.set(sid, 0)
  if (enrolledSubjects.size === 0) return bySubject

  const hasSubjectId = await hasInfinityHistorySubjectId(prisma)
  if (hasSubjectId) {
    const rows = await prisma.infinityHistory.findMany({
      where: {
        userId,
        source: 'ADMIN_ADD',
        amount: { gt: 0 },
      },
      select: { amount: true, source: true, subjectId: true, description: true },
    })
    for (const row of rows) {
      const sid = row.subjectId
      if (sid && bySubject.has(sid)) {
        bySubject.set(sid, (bySubject.get(sid) ?? 0) + row.amount)
        continue
      }
      const inferredSid = inferDebitSubjectId(
        { amount: -Math.abs(row.amount), source: row.source, description: row.description, subjectId: null },
        enrolledSubjects
      )
      if (!inferredSid || !bySubject.has(inferredSid)) continue
      bySubject.set(inferredSid, (bySubject.get(inferredSid) ?? 0) + row.amount)
    }
    return bySubject
  }

  const fallbackRows = await prisma.infinityHistory.findMany({
    where: {
      userId,
      source: 'ADMIN_ADD',
      amount: { gt: 0 },
    },
    select: { amount: true, description: true, source: true },
  })
  for (const row of fallbackRows) {
    const inferredSid = inferDebitSubjectId(
      { amount: -Math.abs(row.amount), source: row.source, description: row.description, subjectId: null },
      enrolledSubjects
    )
    if (!inferredSid || !bySubject.has(inferredSid)) continue
    bySubject.set(inferredSid, (bySubject.get(inferredSid) ?? 0) + row.amount)
  }
  return bySubject
}

export function buildSubjectInfinityRows(
  enrolledSubjects: Map<string, string>,
  earned: Map<string, number>,
  spent: Map<string, number>
): SubjectInfinityRow[] {
  return [...enrolledSubjects.entries()].map(([subjectId, subjectName]) => {
    const earnedPoints = earned.get(subjectId) ?? 0
    const spentPoints = spent.get(subjectId) ?? 0
    const infinityPoints = Math.max(0, earnedPoints - spentPoints)
    return { subjectId, subjectName, infinityPoints, earnedPoints, spentPoints }
  })
}

/** Fan qatorlari umumiy hamyon bilan mos kelishi kerak (29 qoldi → hamma joyda 29). */
export function alignBreakdownToWallet(
  totalWallet: number,
  rows: SubjectInfinityRow[]
): SubjectInfinityRow[] {
  const wallet = Math.max(0, totalWallet)
  if (rows.length === 0) return rows

  if (rows.length === 1) {
    const row = rows[0]
    return [
      {
        ...row,
        infinityPoints: wallet,
        spentPoints: Math.max(0, row.earnedPoints - wallet),
      },
    ]
  }

  const sum = rows.reduce((s, r) => s + r.infinityPoints, 0)
  if (sum <= wallet) return rows

  if (sum === 0) {
    return rows.map((r) => ({ ...r, infinityPoints: 0 }))
  }

  let remainder = wallet
  return rows.map((row, index) => {
    if (index === rows.length - 1) {
      return { ...row, infinityPoints: remainder }
    }
    const share = Math.floor((row.infinityPoints / sum) * wallet)
    remainder -= share
    return { ...row, infinityPoints: share }
  })
}

export async function getStudentSubjectInfinityBreakdown(
  prisma: PrismaClient,
  opts: {
    userId: string
    studentId: string
    enrolledSubjects: Map<string, string>
    /** User.infinityPoints — fan qatorlari shu bilan bir xil bo‘ladi */
    totalWallet: number
  }
): Promise<SubjectInfinityRow[]> {
  const { userId, studentId, enrolledSubjects, totalWallet } = opts
  if (enrolledSubjects.size === 0) return []

  const earnedPromise = loadSubjectEarned(prisma, studentId, enrolledSubjects.keys())
  const adminAddsPromise = loadSubjectAdminAdds(prisma, userId, enrolledSubjects)
  const hasSubjectId = await hasInfinityHistorySubjectId(prisma)
  const historyPromise = hasSubjectId
    ? prisma.infinityHistory.findMany({
        where: { userId, amount: { lt: 0 } },
        select: { amount: true, source: true, description: true, subjectId: true },
      })
    : prisma.infinityHistory.findMany({
        where: { userId, amount: { lt: 0 } },
        select: { amount: true, source: true, description: true },
      }).then((rows) => rows.map((row) => ({ ...row, subjectId: null })))
  const [earned, adminAdds, history] = await Promise.all([earnedPromise, adminAddsPromise, historyPromise])
  for (const [sid, amount] of adminAdds.entries()) {
    if (!earned.has(sid)) continue
    earned.set(sid, (earned.get(sid) ?? 0) + amount)
  }

  const spent = sumDebitsPerSubject(history, enrolledSubjects)
  const rows = buildSubjectInfinityRows(enrolledSubjects, earned, spent)
  return alignBreakdownToWallet(totalWallet, rows)
}

export function getAvailableForSubject(rows: SubjectInfinityRow[], subjectId: string): number {
  return rows.find((r) => r.subjectId === subjectId)?.infinityPoints ?? 0
}
