import { canReadNatijalarData } from '@/lib/natijalar-read-auth'
import { hasSectionAccess, type Permissions } from '@/lib/permissions'

type PermAction = 'view' | 'create' | 'edit' | 'delete'

export async function canReadAdminSchedules(userId: string, role: string): Promise<boolean> {
  if (canReadNatijalarData(role)) return true
  return hasSectionAccess(userId, role, 'schedules', 'view')
}

export async function canMutateAdminSchedules(
  userId: string,
  role: string,
  action: PermAction = 'create'
): Promise<boolean> {
  if (role === 'ADMIN' || role === 'MANAGER') return true
  return hasSectionAccess(userId, role, 'schedules', action)
}

export async function canReadAdminTests(userId: string, role: string): Promise<boolean> {
  if (role === 'ADMIN' || role === 'MANAGER') return true
  return hasSectionAccess(userId, role, 'tests', 'view')
}

export async function canMutateAdminTests(
  userId: string,
  role: string,
  action: PermAction = 'create'
): Promise<boolean> {
  if (role === 'ADMIN' || role === 'MANAGER') return true
  return hasSectionAccess(userId, role, 'tests', action)
}

export async function canReadAdminGroups(userId: string, role: string): Promise<boolean> {
  if (canReadNatijalarData(role)) return true
  return hasSectionAccess(userId, role, 'groups', 'view')
}

export async function canAccessAdminExcelTools(userId: string, role: string): Promise<boolean> {
  if (role === 'ADMIN' || role === 'MANAGER') return true
  const sections: Array<keyof Permissions> = ['schedules', 'students', 'groups']
  for (const section of sections) {
    if (await hasSectionAccess(userId, role, section, 'view')) return true
  }
  return false
}
