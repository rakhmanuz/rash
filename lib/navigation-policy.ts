import { normalizeLearningMode, type LearningMode } from '@/lib/learning-mode'

type UserLike = {
  role?: string | null
  learningMode?: string | null
}

type HostTarget = 'rashUz' | 'rashCom' | 'current'

export type LandingDecision = {
  path: string
  hostTarget: HostTarget
}

const RASH_UZ_HOSTS = new Set(['rash.uz', 'www.rash.uz'])
const RASH_COM_HOSTS = new Set(['rash.com.uz', 'www.rash.com.uz'])

export function isRashUzHost(host: string): boolean {
  return RASH_UZ_HOSTS.has(host.toLowerCase())
}

export function isRashComHost(host: string): boolean {
  return RASH_COM_HOSTS.has(host.toLowerCase())
}

/** O'quvchi paneli — faqat profildagi learningMode (ONLINE / OFFLINE) */
export function studentRootForMode(mode: LearningMode): '/student-online' | '/student-offline' {
  return mode === 'ONLINE' ? '/student-online' : '/student-offline'
}

export function studentDashboardForMode(mode: LearningMode): string {
  return `${studentRootForMode(mode)}/dashboard`
}

export function resolveLandingByRole(user: UserLike): LandingDecision {
  const role = user.role || 'STUDENT'
  const learningMode = normalizeLearningMode(user.learningMode)

  if (role === 'ADMIN' || role === 'MANAGER') {
    return { path: '/admin/dashboard', hostTarget: 'rashUz' }
  }
  if (role === 'ASSISTANT_ADMIN') {
    return { path: '/assistant-admin/dashboard', hostTarget: 'rashCom' }
  }
  if (role === 'RAHBAR') {
    return { path: '/rahbar/dashboard', hostTarget: 'rashUz' }
  }
  if (role === 'TEACHER') {
    return { path: '/teacher/dashboard', hostTarget: 'current' }
  }
  if (role === 'XODIM') {
    return { path: '/xodim/dashboard', hostTarget: 'current' }
  }

  return { path: studentDashboardForMode(learningMode), hostTarget: 'current' }
}

