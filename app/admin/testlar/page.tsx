'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Library, ChevronRight, Loader2 } from 'lucide-react'

type PartRow = {
  id: string
  title: string
  sortOrder: number
  _count: { topics: number }
}

export default function AdminTestBankPartsPage() {
  const [parts, setParts] = useState<PartRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/test-bank/parts')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setParts(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="p-2 rounded-lg bg-violet-500/15 text-violet-300">
              <Library className="h-7 w-7" />
            </span>
            Matematika — testlar bazasi
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl">
            O‘quv dasturi <strong className="text-gray-300">6 ta qism</strong>ga bo‘lingan. Har bir qism ichida{' '}
            <strong className="text-gray-300">mavzular</strong>, mavzu ichida esa savollar{' '}
            <strong className="text-gray-300">rasm</strong> ko‘rinishida; javoblar{' '}
            <strong className="text-gray-300">ochiq matn</strong> — o‘quchi yozadi, tizim to‘g‘ri javob bilan solishtiradi
            (bir nechta variant uchun <code className="text-violet-300">|</code> bilan ajrating).
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 text-violet-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {parts.map((p) => (
              <Link
                key={p.id}
                href={`/admin/testlar/${p.id}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-gray-700 bg-slate-800/90 p-5 hover:border-violet-500/50 hover:bg-slate-800 transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    {p.sortOrder}-qism
                  </p>
                  <h2 className="text-lg font-semibold text-white group-hover:text-violet-200">{p.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{p._count.topics} ta mavzu</p>
                </div>
                <ChevronRight className="h-6 w-6 text-gray-500 group-hover:text-violet-400 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
