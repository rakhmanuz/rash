'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { OnlinePageHeader } from '@/components/student-online/online-ui'
import { isOnlineStudentPath } from '@/lib/student-online-route'

type Props = {
  title: string
  description: string
  fallbackHref: string
  fallbackLabel: string
}

function PlaceholderBody({ title, description, fallbackHref, fallbackLabel, online }: Props & { online: boolean }) {
  return (
    <div className={online ? 'online-shell online-page-bg mx-auto max-w-3xl space-y-4 py-2' : 'space-y-5'}>
      {online ? (
        <OnlinePageHeader title={title} subtitle={description} />
      ) : (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-sm text-slate-300">{description}</p>
        </div>
      )}
      <Link
        href={fallbackHref}
        className={
          online
            ? 'online-card online-card-lift inline-flex px-5 py-3 text-sm font-semibold text-green-700'
            : 'inline-flex rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300'
        }
      >
        {fallbackLabel}
      </Link>
    </div>
  )
}

export function SectionPlaceholder(props: Props) {
  const pathname = usePathname() || ''
  const online = isOnlineStudentPath(pathname)

  return (
    <DashboardLayout role="STUDENT">
      <PlaceholderBody {...props} online={online} />
    </DashboardLayout>
  )
}
