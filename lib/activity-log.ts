import { prisma, type PrismaTransactionClient } from '@/lib/prisma'

export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'ADJUST' | 'RECORD' | 'ENROLL' | 'RESET'

export type ActivityLogInput = {
  actorUserId: string
  actorRole: string
  actorName: string
  action: ActivityAction
  category: string
  summary: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
}

type ActivityDb = typeof prisma | PrismaTransactionClient

export function roleLabelUz(role: string): string {
  switch (role) {
    case 'ADMIN':
      return 'Admin'
    case 'MANAGER':
      return 'Menejer'
    case 'TEACHER':
      return "O'qituvchi"
    case 'RAHBAR':
      return 'Rahbar'
    default:
      return role
  }
}

export function categoryLabelUz(category: string): string {
  const map: Record<string, string> = {
    student: "O'quvchi",
    teacher: "O'qituvchi",
    test_result: 'Test natijasi',
    written_work: 'Yozma ish',
    infinity: 'Infinity',
    group: 'Guruh',
    attendance: 'Davomat',
    schedule: 'Dars rejasi',
    payment: "To'lov",
    import: 'Import',
  }
  return map[category] || category
}

export async function logActivity(db: ActivityDb, input: ActivityLogInput): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        actorUserId: input.actorUserId,
        actorRole: input.actorRole,
        actorName: input.actorName,
        action: input.action,
        category: input.category,
        summary: input.summary.slice(0, 500),
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    })
  } catch (error) {
    console.error('Activity log yozilmadi:', error)
  }
}

export type ActivityActor = { id: string; role: string; name: string }

export async function logActivityForUser(
  db: ActivityDb,
  actor: ActivityActor,
  input: Omit<ActivityLogInput, 'actorUserId' | 'actorRole' | 'actorName'>
): Promise<void> {
  return logActivity(db, {
    actorUserId: actor.id,
    actorRole: actor.role,
    actorName: actor.name,
    ...input,
  })
}
