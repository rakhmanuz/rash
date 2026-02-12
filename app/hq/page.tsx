import Link from 'next/link'

export default function HQHomePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold">Head Admin Control</h1>
        <p className="mt-2 text-slate-300">
          Bu panel `rash.uz` frontendidan alohida ishlaydi va faqat umumiy ma&apos;lumotlar bazasini boshqaradi.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/hq/admins"
          className="rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-6 transition hover:bg-indigo-500/20"
        >
          <h2 className="text-xl font-semibold">Adminlar boshqaruvi</h2>
          <p className="mt-2 text-sm text-slate-300">Admin tayinlash, ruxsat berish va vazifa biriktirish</p>
        </Link>
      </div>
    </div>
  )
}
