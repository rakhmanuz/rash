/** Faqat `app/student/` ostida — online/offline prefix ga yo'naltirilmaydi */
const STUDENT_LEGACY_PREFIXES = [
  '/student/vazifa-topshirirish',
  '/student/test-banka',
  '/student/stipendiya',
  '/student/ai-tekshiruv',
] as const

export function isStudentLegacySharedPath(pathname: string): boolean {
  return STUDENT_LEGACY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}
