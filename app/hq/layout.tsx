import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { isSuperAdminSession } from '@/lib/super-admin'

export default async function HQLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!isSuperAdminSession(session)) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  )
}
