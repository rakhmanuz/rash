import { randomUUID } from 'crypto'

type HistoryPayload = {
  studentId: string
  paymentId?: string | null
  action: string
  actorId?: string | null
  actorName?: string | null
  amountBefore?: number | null
  amountAfter?: number | null
  changedAmount?: number | null
  details?: string | null
}

let tableEnsured = false

async function ensureHistoryTable(db: any) {
  if (tableEnsured) return

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PaymentHistory" (
      "id" TEXT PRIMARY KEY,
      "studentId" TEXT NOT NULL,
      "paymentId" TEXT,
      "action" TEXT NOT NULL,
      "actorId" TEXT,
      "actorName" TEXT,
      "amountBefore" REAL,
      "amountAfter" REAL,
      "changedAmount" REAL,
      "details" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await db.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "idx_payment_history_student_created" ON "PaymentHistory" ("studentId", "createdAt" DESC)`
  )
  tableEnsured = true
}

export async function appendPaymentHistory(db: any, payload: HistoryPayload) {
  try {
    await ensureHistoryTable(db)
    await db.$executeRaw`
      INSERT INTO "PaymentHistory"
        ("id", "studentId", "paymentId", "action", "actorId", "actorName", "amountBefore", "amountAfter", "changedAmount", "details", "createdAt")
      VALUES
        (${randomUUID()}, ${payload.studentId}, ${payload.paymentId ?? null}, ${payload.action}, ${payload.actorId ?? null}, ${payload.actorName ?? null}, ${payload.amountBefore ?? null}, ${payload.amountAfter ?? null}, ${payload.changedAmount ?? null}, ${payload.details ?? null}, ${new Date()})
    `
  } catch (error) {
    console.warn('[payment-history] log write failed:', error)
  }
}

export async function getPaymentHistoryByStudent(db: any, studentId: string) {
  await ensureHistoryTable(db)
  const rows = await db.$queryRaw<
    Array<{
      id: string
      studentId: string
      paymentId: string | null
      action: string
      actorId: string | null
      actorName: string | null
      amountBefore: number | null
      amountAfter: number | null
      changedAmount: number | null
      details: string | null
      createdAt: string
    }>
  >`
    SELECT
      "id",
      "studentId",
      "paymentId",
      "action",
      "actorId",
      "actorName",
      "amountBefore",
      "amountAfter",
      "changedAmount",
      "details",
      "createdAt"
    FROM "PaymentHistory"
    WHERE "studentId" = ${studentId}
    ORDER BY "createdAt" DESC
    LIMIT 300
  `
  return rows
}
