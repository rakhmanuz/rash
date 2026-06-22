export const EMPLOYEE_TYPES = ['SYSTEM_ADMINISTRATOR', 'ASSISTANT', 'RECEPTIONIST'] as const

export type EmployeeType = (typeof EMPLOYEE_TYPES)[number]

export function isEmployeeType(value: unknown): value is EmployeeType {
  return typeof value === 'string' && (EMPLOYEE_TYPES as readonly string[]).includes(value)
}

export function normalizeEmployeeType(value: unknown): EmployeeType | null {
  if (!isEmployeeType(value)) return null
  return value
}

export function employeeTypeLabel(value: string | null | undefined): string {
  if (value === 'SYSTEM_ADMINISTRATOR') return 'System Administrator'
  if (value === 'ASSISTANT') return 'Assistant'
  if (value === 'RECEPTIONIST') return 'Receptionist'
  return 'Belgilanmagan'
}
