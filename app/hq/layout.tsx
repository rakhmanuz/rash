import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { isSuperAdminSession } from '@/lib/super-admin'
import Link from 'next/link'
import { ShieldCheck, Users, LayoutDashboard } from 'lucide-react'

export const metadata = {
  title: 'rash.com.uz | Head Admin',
  description: 'rash.com.uz uchun alohida Head Admin panel',
}

export function generateViewport() {
  return {
    themeColor: '#0b1f4f',
    colorScheme: 'dark',
  }
}

export default async function HQLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!isSuperAdminSession(session)) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(37,99,235,0.26),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(30,64,175,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,64,175,0.12)_1px,transparent_1px)] bg-[size:44px_44px]" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[260px_1fr] lg:gap-8">
        <aside className="rounded-2xl border border-blue-500/30 bg-[#061233]/85 p-5 backdrop-blur-xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/20 p-2">
              <ShieldCheck className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-blue-200/80">rash.com.uz</p>
              <h2 className="text-lg font-semibold">Head Admin</h2>
            </div>
          </div>

          <nav className="space-y-2">
            <Link href="/hq" className="flex items-center gap-3 rounded-xl border border-blue-900/50 px-3 py-2.5 text-blue-100 hover:bg-blue-900/30">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/hq/admins" className="flex items-center gap-3 rounded-xl border border-blue-900/50 px-3 py-2.5 text-blue-100 hover:bg-blue-900/30">
              <Users className="h-4 w-4" />
              Adminlar
            </Link>
          </nav>
        </aside>

        <main className="rounded-2xl border border-blue-500/20 bg-[#030d2a]/70 p-4 backdrop-blur-xl sm:p-6">{children}</main>
      </div>
    </div>
  )
}
