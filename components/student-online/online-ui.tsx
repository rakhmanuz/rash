'use client'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { Activity, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const LOGO_FULL_SRC = '/rash-uz-logo.png'
const LOGO_MARK_SRC = '/rash-uz-mark.png'

/** rash.uz rasmiy logotipi — to'liq (globus + matn) yoki yig'ilgan (hexagon) */
export function RashUzLogo({
  className,
  variant = 'full',
}: {
  className?: string
  variant?: 'full' | 'mark'
}) {
  if (variant === 'mark') {
    return (
      <Image
        src={LOGO_MARK_SRC}
        alt="rash.uz"
        width={56}
        height={56}
        className={cn('h-14 w-14 shrink-0 object-contain', className)}
        priority
      />
    )
  }

  return (
    <div
      className={cn(
        'relative h-[4.75rem] w-full max-w-[min(100%,15.5rem)] shrink-0 overflow-hidden',
        className
      )}
    >
      <Image
        src={LOGO_FULL_SRC}
        alt="rash.uz"
        width={320}
        height={80}
        className="absolute left-0 top-1/2 h-[5.75rem] w-auto max-w-none -translate-y-1/2 object-contain object-left"
        priority
      />
    </div>
  )
}

/** @deprecated RashUzLogo ishlating */
export function OnlineLogoMark({ className }: { className?: string }) {
  return <RashUzLogo variant="mark" className={className} />
}

export function OnlineDashboardHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="online-card online-card-lift flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0 flex-1">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 sm:text-2xl">
          <Activity className="h-6 w-6 text-green-500" strokeWidth={2.25} />
          Online o&apos;quvchi paneli
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-500">{subtitle}</p>
      </div>
      <HeaderIllustration />
    </div>
  )
}

function HeaderIllustration() {
  return (
    <div className="relative mx-auto hidden h-[100px] w-[140px] shrink-0 sm:mx-0 sm:block">
      <div className="absolute inset-0 rounded-full bg-green-100/80" />
      <div className="absolute bottom-1 left-1/2 h-2 w-[70%] -translate-x-1/2 rounded-full bg-gray-200/90 blur-[2px]" />
      <div className="absolute left-1/2 top-2 w-[82%] -translate-x-1/2 rounded-xl border border-white bg-white p-2.5 shadow-[0_12px_32px_rgba(34,197,94,0.15)]">
        <div className="mb-2 h-1.5 w-8 rounded-full bg-green-400" />
        <div className="space-y-1">
          <div className="h-1 rounded bg-gray-200" />
          <div className="h-1 w-3/4 rounded bg-gray-100" />
        </div>
        <div className="mt-2 flex gap-1">
          <div className="h-5 flex-1 rounded bg-green-50" />
          <div className="h-5 flex-1 rounded bg-sky-50" />
        </div>
      </div>
      <div className="absolute -right-0.5 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M9 1 7 5H3l3.5 4.5L5 14l6-7.5L9 1z" />
        </svg>
      </div>
    </div>
  )
}

const KPI_STYLES = {
  emerald: { bg: 'bg-green-50', text: 'text-green-600' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
} as const

export function OnlineKpiCard({
  label,
  value,
  icon: Icon,
  tone = 'emerald',
}: {
  label: string
  value: number
  icon: LucideIcon
  tone?: keyof typeof KPI_STYLES
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  const s = KPI_STYLES[tone]

  return (
    <div className="online-card online-card-lift p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', s.bg)}>
          <Icon className={cn('h-[18px] w-[18px]', s.text)} strokeWidth={2.25} />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums text-gray-900">{pct}%</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function OnlineStatBlock({
  label,
  children,
  visual,
}: {
  label: string
  children: ReactNode
  visual: 'infinity' | 'wallet' | 'chart'
}) {
  return (
    <div className="online-card online-card-lift flex items-center justify-between gap-4 p-5 sm:p-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className="mt-2">{children}</div>
      </div>
      <StatVisual type={visual} />
    </div>
  )
}

function StatVisual({ type }: { type: 'infinity' | 'wallet' | 'chart' }) {
  return (
    <div className="relative flex h-[72px] w-[80px] shrink-0 items-center justify-center">
      <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-gray-50 to-white shadow-inner ring-1 ring-gray-100" />
      {type === 'infinity' && (
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-300 to-green-500 shadow-[0_6px_16px_rgba(34,197,94,0.35)]">
          <span className="text-xl font-black text-white">∞</span>
        </div>
      )}
      {type === 'wallet' && (
        <svg viewBox="0 0 48 40" className="relative h-10 w-12" aria-hidden>
          <rect x="6" y="14" width="36" height="22" rx="6" fill="#fda4af" />
          <rect x="10" y="8" width="22" height="12" rx="4" fill="#fb7185" />
        </svg>
      )}
      {type === 'chart' && (
        <svg viewBox="0 0 56 40" className="relative h-10 w-14" aria-hidden>
          <polyline
            points="2,30 14,22 26,26 38,12 52,16"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <rect x="10" y="22" width="6" height="14" rx="2" fill="#4ade80" />
          <rect x="22" y="16" width="6" height="20" rx="2" fill="#38bdf8" />
          <rect x="34" y="20" width="6" height="16" rx="2" fill="#a78bfa" />
        </svg>
      )}
    </div>
  )
}

export function OnlineQuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  return (
    <Link
      href={href}
      className="online-card online-card-lift group flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
          <Icon className="h-5 w-5 text-green-600" strokeWidth={2} />
        </div>
        <span className="font-semibold text-gray-800">{label}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-green-600" />
    </Link>
  )
}

export function OnlinePageHeader({ title, subtitle }: { title: ReactNode; subtitle: string }) {
  return (
    <div className="online-card p-5 sm:p-6">
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
    </div>
  )
}
