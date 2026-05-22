import { isStudentLegacySharedPath } from '@/lib/student-legacy-paths'

/** Online o'quvchi panel yo'llari — layout va tema uchun */
export function isOnlineStudentPath(pathname: string): boolean {
  return pathname.startsWith('/student-online')
}

export function isStudentPanelPath(pathname: string): boolean {
  return (
    isStudentLegacySharedPath(pathname) ||
    pathname.startsWith('/student-online') ||
    pathname.startsWith('/student-offline') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/teacher') ||
    pathname.startsWith('/rahbar') ||
    pathname.startsWith('/assistant-admin') ||
    pathname.startsWith('/monitor')
  )
}
