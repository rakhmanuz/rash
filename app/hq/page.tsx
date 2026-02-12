import Link from 'next/link'
import { ArrowRight, Users, LockKeyhole } from 'lucide-react'

export default function HQHomePage() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-blue-400/30 bg-gradient-to-br from-blue-950/80 to-indigo-950/70 p-7">
        <p className="mb-2 inline-block rounded-full border border-blue-400/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-200">
          Independent Frontend
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-blue-50">rash.com.uz Head Admin Control</h1>
        <p className="mt-3 max-w-2xl text-blue-100/85">
          Bu panel `rash.uz`dan vizual va navigatsiya jihatdan mustaqil. Siz shu yerda adminlarni tayinlaysiz, vazifalarni biriktirasiz va boshqaruvni markazlashtirasiz.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/hq/admins"
          className="group rounded-2xl border border-blue-500/40 bg-[#07173f] p-6 transition hover:border-blue-400 hover:bg-[#0a1f57]"
        >
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15">
            <Users className="h-5 w-5 text-blue-300" />
          </div>
          <h2 className="text-xl font-semibold text-blue-50">Adminlar boshqaruvi</h2>
          <p className="mt-2 text-sm text-blue-100/75">Admin tayinlash, ruxsat berish va vazifa biriktirish</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-blue-300">
            Ochish
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </div>
        </Link>

        <div className="rounded-2xl border border-blue-500/30 bg-[#06153a] p-6">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15">
            <LockKeyhole className="h-5 w-5 text-indigo-300" />
          </div>
          <h2 className="text-xl font-semibold text-blue-50">Xavfsizlik markazi</h2>
          <p className="mt-2 text-sm text-blue-100/75">
            Faqat super-admin kirishi mumkin. Domen oqimi `rash.com.uz` uchun alohida himoyalangan.
          </p>
        </div>
      </div>
    </div>
  )
}
