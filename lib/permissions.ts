import { prisma } from './prisma'

export interface Permission {
  view?: boolean
  create?: boolean
  edit?: boolean
  delete?: boolean
}

export interface Permissions {
  students?: Permission
  teachers?: Permission
  groups?: Permission
  schedules?: Permission
  tests?: Permission
  payments?: Permission
  market?: Permission
  reports?: Permission
}

/**
 * Yordamchi adminning ruxsatlarini olish
 */
export async function getAssistantAdminPermissions(userId: string): Promise<Permissions | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { assistantAdminProfile: true },
    })

    if (!user || user.role !== 'ASSISTANT_ADMIN' || !user.assistantAdminProfile) {
      return null
    }

    const permissions = user.assistantAdminProfile.permissions
    return permissions ? JSON.parse(permissions) : {}
  } catch (error) {
    console.error('Error getting permissions:', error)
    return null
  }
}

/**
 * Yordamchi adminning ma'lum bir bo'limda ruxsati bor-yo'qligini tekshirish
 */
export async function hasPermission(
  userId: string,
  section: keyof Permissions,
  permission: keyof Permission
): Promise<boolean> {
  const permissions = await getAssistantAdminPermissions(userId)
  if (!permissions) return false

  const sectionPerms = permissions[section]
  if (!sectionPerms) return false

  return sectionPerms[permission] === true
}

/**
 * Yordamchi adminning ma'lum bir bo'limda ko'rish ruxsati bor-yo'qligini tekshirish
 */
export async function canView(userId: string, section: keyof Permissions): Promise<boolean> {
  return hasPermission(userId, section, 'view')
}

/**
 * Yordamchi adminning ma'lum bir bo'limda yaratish ruxsati bor-yo'qligini tekshirish
 */
export async function canCreate(userId: string, section: keyof Permissions): Promise<boolean> {
  return hasPermission(userId, section, 'create')
}

/**
 * Yordamchi adminning ma'lum bir bo'limda tahrirlash ruxsati bor-yo'qligini tekshirish
 */
export async function canEdit(userId: string, section: keyof Permissions): Promise<boolean> {
  return hasPermission(userId, section, 'edit')
}

/**
 * Yordamchi adminning ma'lum bir bo'limda o'chirish ruxsati bor-yo'qligini tekshirish
 */
export async function canDelete(userId: string, section: keyof Permissions): Promise<boolean> {
  return hasPermission(userId, section, 'delete')
}
