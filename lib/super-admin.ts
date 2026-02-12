import { Session } from 'next-auth'

type BasicUser = {
  id?: string
  username?: string | null
  role?: string | null
}

function normalizeUsername(username?: string | null) {
  return (username || '').trim().toLowerCase()
}

export function isSuperAdminUser(user?: BasicUser | null): boolean {
  if (!user) return false

  if (user.role === 'SUPER_ADMIN') return true

  const ownerFromEnv = normalizeUsername(process.env.OWNER_USERNAME || process.env.SUPER_ADMIN_USERNAME)
  if (!ownerFromEnv) return false

  return normalizeUsername(user.username) === ownerFromEnv
}

export function isSuperAdminSession(session?: Session | null): boolean {
  if (!session?.user) return false

  return isSuperAdminUser({
    id: (session.user as any).id,
    role: (session.user as any).role,
    username: (session.user as any).username || (session.user as any).name,
  })
}
