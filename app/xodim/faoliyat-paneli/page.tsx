'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Info,
  Loader2,
  Target,
  TrendingUp,
} from 'lucide-react'
import {
  employeeTypeLabel,
  isEmployeeType,
  type EmployeeType,
} from '@/lib/employee-types'

type EmployeeProfile = {
  id: string
  name: string
  employeeType?: string | null
}

type XodimTask = {
  id: string
  title: string
  status: 'PENDING' | 'COMPLETED' | string
  dueDate?: string | null
  completedAt?: string | null
}

type ActivityBlueprint = {
  roleGoal: string
  focusAreas: string[]
  weeklyChecks: string[]
}

const DEFAULT_BLUEPRINT: ActivityBlueprint = {
  roleGoal: 'Asosiy ishlarni tizimli va o‘z vaqtida bajarish',
  focusAreas: [
    'Berilgan topshiriqlarni muddatida bajarish',
    'Jadvalga qatʼiy rioya qilish',
    'Rahbariyat bilan doimiy aloqa',
  ],
  weeklyChecks: [
    'Haftalik topshiriqlar rejasini tekshirish',
    'Bajarilgan ishlar bo‘yicha qisqa hisobot tayyorlash',
    'Keyingi hafta ustuvor vazifalarni belgilash',
  ],
}

const BLUEPRINT_BY_TYPE: Record<EmployeeType, ActivityBlueprint> = {
  SYSTEM_ADMINISTRATOR: {
    roleGoal: 'Tizim uzluksiz ishlashini taʼminlash va texnik barqarorlikni ushlash',
    focusAreas: [
      'Platforma xatolarini tezkor aniqlash va bartaraf etish',
      'Foydalanuvchi rollari, ruxsatlar va xavfsizlik nazorati',
      'Texnik jarayonlar va xizmatlar monitoringi',
    ],
    weeklyChecks: [
      'Tizim xatolik loglarini tahlil qilish',
      'Muhim modullar bo‘yicha profilaktik tekshiruv',
      'Texnik yaxshilashlar bo‘yicha qisqa reja',
    ],
  },
  ASSISTANT: {
    roleGoal: 'Admin jarayonlarini yengillashtirish va operativ ish oqimini qo‘llab-quvvatlash',
    focusAreas: [
      'Kundalik topshiriqlarni reja asosida yuritish',
      'Maʼlumotlarni tartibli saqlash va yangilash',
      'Bo‘limlar o‘rtasidagi aloqa va koordinatsiya',
    ],
    weeklyChecks: [
      'Bajarilgan topshiriqlar reyestrini yangilash',
      'Kechikayotgan vazifalar bo‘yicha eslatma berish',
      'Rahbar uchun qisqa faoliyat xulosasi tayyorlash',
    ],
  },
  RECEPTIONIST: {
    roleGoal: 'Markazga murojaatlarni sifatli qabul qilish va tashkiliy tartibni ushlash',
    focusAreas: [
      'Keluvchi murojaatlar va tashriflarni to‘g‘ri yo‘naltirish',
      'Qabul jarayonlarini tezkor va aniq yuritish',
      'Telefon/aloqa orqali maʼlumot berish madaniyati',
    ],
    weeklyChecks: [
      'Murojaatlar holatini haftalik ko‘rib chiqish',
      'Qabul jadvali va navbat tartibini tekshirish',
      'Mijozlar bilan ishlash sifati bo‘yicha ichki tahlil',
    ],
  },
}

export default function XodimFaoliyatPaneliPage() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null)
  const [tasks, setTasks] = useState<XodimTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const [profileRes, tasksRes] = await Promise.all([
          fetch('/api/xodim/profile'),
          fetch('/api/xodim/tasks'),
        ])

        if (!profileRes.ok) throw new Error('Profil maʼlumotini olishda xatolik')
        if (!tasksRes.ok) throw new Error('Topshiriqlar maʼlumotini olishda xatolik')

        const profileData = (await profileRes.json()) as EmployeeProfile
        const tasksData = (await tasksRes.json()) as XodimTask[]
        setProfile(profileData)
        setTasks(tasksData)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const employeeType = useMemo(() => {
    const raw = profile?.employeeType
    return isEmployeeType(raw) ? raw : null
  }, [profile?.employeeType])

  const blueprint = employeeType ? BLUEPRINT_BY_TYPE[employeeType] : DEFAULT_BLUEPRINT

  const metrics = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length
    const pending = total - completed
    const now = Date.now()
    const overdue = tasks.filter(
      (t) => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate).getTime() < now
    ).length
    const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, pending, overdue, completionPercent }
  }, [tasks])

  if (loading) {
    return (
      <DashboardLayout role="XODIM">
        <div className="mx-auto flex min-h-[50vh] w-full max-w-5xl items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-3 text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Yuklanmoqda...
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="XODIM">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-5">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <TrendingUp className="h-6 w-6 text-violet-300" />
            Faoliyat paneli
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Xodim turiga mos asosiy ish yo&apos;nalishlari va amaliy holat.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-200">
            <Info className="h-3.5 w-3.5" />
            Xodim turi: {employeeTypeLabel(employeeType)}
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
            <div className="flex items-center gap-2 text-slate-300">
              <ClipboardList className="h-4 w-4 text-violet-300" />
              Jami topshiriqlar
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{metrics.total}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-violet-300" />
              Bajarilgan topshiriqlar
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{metrics.completed}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
            <div className="flex items-center gap-2 text-slate-300">
              <Target className="h-4 w-4 text-violet-300" />
              Bajarilish foizi
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{metrics.completionPercent}%</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
            <div className="flex items-center gap-2 text-slate-300">
              <AlertTriangle className="h-4 w-4 text-violet-300" />
              Kechikkan vazifalar
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{metrics.overdue}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5">
            <div className="mb-3 flex items-center gap-2 text-violet-200">
              <TrendingUp className="h-4 w-4" />
              Asosiy ish yo&apos;nalishlari
            </div>
            <p className="mb-3 text-sm text-slate-200">{blueprint.roleGoal}</p>
            <ul className="space-y-2 text-sm text-slate-300">
              {blueprint.focusAreas.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-5">
            <div className="mb-3 flex items-center gap-2 text-slate-200">
              <ClipboardList className="h-4 w-4 text-violet-300" />
              Haftalik nazorat nuqtalari
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              {blueprint.weeklyChecks.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-violet-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-200">
            <ClipboardList className="h-4 w-4 text-violet-300" />
            Hozirgi ish holati
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
              <p className="text-xs text-slate-400">Jarayondagi topshiriqlar</p>
              <p className="mt-1 text-lg font-semibold text-white">{metrics.pending}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
              <p className="text-xs text-slate-400">Bajarilgan topshiriqlar</p>
              <p className="mt-1 text-lg font-semibold text-white">{metrics.completed}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Bu bo&apos;lim xodimning asosiy ish jarayonini turiga qarab ko&apos;rsatadi.
          </p>
        </div>

        {!employeeType ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 text-amber-300" />
              <div>
                <p className="font-medium text-amber-200">Xodim turi belgilanmagan</p>
                <p className="mt-1 text-sm text-slate-300">
                  Admin panelda xodim turini tanlasangiz, faoliyat paneli to&apos;liq turga moslashadi.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 text-violet-300" />
            <div>
              <p className="font-medium text-violet-200">Panel dinamik ishlayapti</p>
              <p className="mt-1 text-sm text-slate-300">
                Xodim turi o&apos;zgarsa, faoliyat paneli avtomatik ravishda shu turga mos mazmunga o&apos;tadi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
