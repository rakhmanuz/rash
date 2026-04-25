import { randomUUID } from 'crypto'

let tableEnsured = false

async function ensurePlanTable(db: any) {
  if (tableEnsured) return
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PaymentPlan" (
      "id" TEXT PRIMARY KEY,
      "studentId" TEXT NOT NULL,
      "subjectId" TEXT NOT NULL,
      "subjectName" TEXT,
      "monthKey" TEXT NOT NULL,
      "plannedAmount" REAL NOT NULL,
      "dueDate" DATETIME,
      "updatedById" TEXT,
      "updatedByName" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await db.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "idx_payment_plan_unique" ON "PaymentPlan" ("studentId", "subjectId", "monthKey")`
  )
  tableEnsured = true
}

export async function getPaymentPlans(db: any, studentId: string, monthKey: string) {
  await ensurePlanTable(db)
  return db.$queryRaw<
    Array<{
      id: string
      studentId: string
      subjectId: string
      subjectName: string | null
      monthKey: string
      plannedAmount: number
      dueDate: string | null
      updatedById: string | null
      updatedByName: string | null
      createdAt: string
      updatedAt: string
    }>
  >`
    SELECT
      "id", "studentId", "subjectId", "subjectName", "monthKey", "plannedAmount", "dueDate",
      "updatedById", "updatedByName", "createdAt", "updatedAt"
    FROM "PaymentPlan"
    WHERE "studentId" = ${studentId} AND "monthKey" = ${monthKey}
    ORDER BY "subjectName" ASC
  `
}

export async function upsertPaymentPlan(
  db: any,
  input: {
    studentId: string
    subjectId: string
    subjectName: string
    monthKey: string
    plannedAmount: number
    dueDate?: string | null
    updatedById?: string | null
    updatedByName?: string | null
  }
) {
  await ensurePlanTable(db)
  const existing = await db.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "PaymentPlan"
    WHERE "studentId" = ${input.studentId}
      AND "subjectId" = ${input.subjectId}
      AND "monthKey" = ${input.monthKey}
    LIMIT 1
  `

  if (existing.length > 0) {
    await db.$executeRaw`
      UPDATE "PaymentPlan"
      SET
        "subjectName" = ${input.subjectName},
        "plannedAmount" = ${input.plannedAmount},
        "dueDate" = ${input.dueDate ? new Date(input.dueDate) : null},
        "updatedById" = ${input.updatedById ?? null},
        "updatedByName" = ${input.updatedByName ?? null},
        "updatedAt" = ${new Date()}
      WHERE "id" = ${existing[0].id}
    `
    return existing[0].id
  }

  const id = randomUUID()
  await db.$executeRaw`
    INSERT INTO "PaymentPlan"
      ("id", "studentId", "subjectId", "subjectName", "monthKey", "plannedAmount", "dueDate", "updatedById", "updatedByName", "createdAt", "updatedAt")
    VALUES
      (${id}, ${input.studentId}, ${input.subjectId}, ${input.subjectName}, ${input.monthKey}, ${input.plannedAmount}, ${input.dueDate ? new Date(input.dueDate) : null}, ${input.updatedById ?? null}, ${input.updatedByName ?? null}, ${new Date()}, ${new Date()})
  `
  return id
}
