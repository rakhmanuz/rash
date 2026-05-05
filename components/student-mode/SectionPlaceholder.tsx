'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/components/DashboardLayout'

type Props = {
  title: string
  description: string
  fallbackHref: string
  fallbackLabel: string
}

export function SectionPlaceholder({ title, description, fallbackHref, fallbackLabel }: Props) {
  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-sm text-slate-300">{description}</p>
        </div>
        <Link
          href={fallbackHref}
          className="inline-flex rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300"
        >
          {fallbackLabel}
        </Link>
      </div>
    </DashboardLayout>
  )
}

