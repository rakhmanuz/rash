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

export default function StudentTestBankPartsPage() {
  const [parts, setParts] = useState<PartRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/test-bank/parts')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setParts(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="p-2 rounded-lg bg-sky-500/15 text-sky-300">
              <Library className="h-7 w-7" />
            </span>
            Matematika — test bazasi
          </h1>
          <p className="text-sm text-slate-400">
            Qismni tanlang, keyin mavzuni oching. Har bir savol rasmda; javobingizni yozib tekshirasiz.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 text-sky-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {parts.map((p) => (
              <Link
                key={p.id}
                href={`/student/test-banka/${p.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900/60 p-4 hover:border-sky-500/40 transition-colors"
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{p.sortOrder}-qism</p>
                  <h2 className="font-semibold text-white">{p.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{p._count.topics} mavzu</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-500" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
