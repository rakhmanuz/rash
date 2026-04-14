'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react'

type TopicRow = {
  id: string
  title: string
  _count: { questions: number }
}

type PartDetail = {
  id: string
  title: string
  sortOrder: number
  topics: TopicRow[]
}

export default function StudentTestBankTopicsPage() {
  const params = useParams()
  const router = useRouter()
  const partId = params.partId as string
  const [part, setPart] = useState<PartDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch(`/api/student/test-bank/parts/${partId}/topics`)
    if (!res.ok) setPart(null)
    else setPart(await res.json())
  }, [partId])

  useEffect(() => {
    let c = false
    setLoading(true)
    load().finally(() => {
      if (!c) setLoading(false)
    })
    return () => {
      c = true
    }
  }, [load])

  if (loading) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 text-sky-400 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!part) {
    return (
      <DashboardLayout role="STUDENT">
        <p className="text-red-400">Topilmadi</p>
        <Link href="/student/test-banka" className="text-sky-400 underline mt-4 inline-block">
          Orqaga
        </Link>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => router.push('/student/test-banka')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Qismlar
        </button>
        <h1 className="text-xl font-bold text-white">{part.title}</h1>
        <div className="space-y-2">
          {part.topics.length === 0 ? (
            <p className="text-slate-500 text-sm">Bu qismda hali mavzular yo‘q.</p>
          ) : (
            part.topics.map((t) => (
              <Link
                key={t.id}
                href={`/student/test-banka/${partId}/${t.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 p-4 hover:border-sky-500/35"
              >
                <div>
                  <h2 className="font-medium text-white">{t.title}</h2>
                  <p className="text-xs text-slate-500">{t._count.questions} savol</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-500" />
              </Link>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
