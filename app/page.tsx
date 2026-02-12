import { PremiumHero } from '@/components/landing/PremiumHero'
import Link from 'next/link'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const headersList = headers()
  const host = (headersList.get('x-forwarded-host') || headersList.get('host') || '').toLowerCase()
  const isRashComDomain = host.includes('rash.com.uz')

  if (isRashComDomain) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#060d1f] via-[#0a1b3b] to-[#050b19] text-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="rounded-2xl border border-blue-500/30 bg-slate-900/60 p-8 shadow-2xl shadow-blue-900/40">
            <p className="mb-3 inline-flex rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
              rash.com.uz yordamchi admin portali
            </p>
            <h1 className="text-3xl font-bold md:text-5xl">Yordamchi adminlar uchun professional ish paneli</h1>
            <p className="mt-4 max-w-3xl text-base text-slate-300 md:text-lg">
              Login va parolni `rash.uz` admin paneli orqali olasiz. Tizimga kirgandan so&apos;ng sizga berilgan ruxsatlar asosida bo&apos;limlar ochiladi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Tizimga kirish
              </Link>
              <a
                href="https://rash.uz/admin/dashboard"
                className="rounded-lg border border-blue-400/40 px-5 py-3 font-semibold text-blue-200 transition-colors hover:bg-blue-500/10"
              >
                Admin panel (rash.uz)
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-visible">
      <PremiumHero />
    </div>
  )
}
