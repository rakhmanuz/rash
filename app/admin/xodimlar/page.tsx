'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Briefcase,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  ArrowRight,
} from 'lucide-react'
import { EMPLOYEE_TYPES, employeeTypeLabel, type EmployeeType } from '@/lib/employee-types'

type Employee = {
  id: string
  username: string
  name: string
  phone?: string | null
  employeeType?: EmployeeType | null
  role: string
  isActive: boolean
}

const initialForm = {
  username: '',
  name: '',
  password: '',
  phone: '',
  employeeType: 'ASSISTANT' as EmployeeType,
  isActive: true,
}

export default function XodimlarPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/admin/xodimlar')
      if (response.ok) {
        setEmployees(await response.json())
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const openCreateModal = () => {
    setEditingEmployee(null)
    setForm(initialForm)
    setShowPassword(false)
    setShowModal(true)
  }

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee)
    setForm({
      username: employee.username,
      name: employee.name,
      password: '',
      phone: employee.phone || '',
      employeeType: employee.employeeType || 'ASSISTANT',
      isActive: employee.isActive,
    })
    setShowPassword(false)
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingEmployee
        ? `/api/admin/xodimlar/${editingEmployee.id}`
        : '/api/admin/xodimlar'
      const method = editingEmployee ? 'PUT' : 'POST'
      const payload = editingEmployee
        ? {
            username: form.username,
            name: form.name,
            password: form.password || undefined,
            phone: form.phone,
            employeeType: form.employeeType,
            isActive: form.isActive,
          }
        : form

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        alert(err?.error || 'Xatolik yuz berdi')
        return
      }

      setShowModal(false)
      await fetchEmployees()
    } catch (error) {
      console.error('Error saving employee:', error)
      alert('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`${employee.name} ni o'chirasizmi?`)) return
    try {
      const response = await fetch(`/api/admin/xodimlar/${employee.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        alert(err?.error || 'Xatolik yuz berdi')
        return
      }
      await fetchEmployees()
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('Xatolik yuz berdi')
    }
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-violet-700 to-fuchsia-700 p-5 text-white sm:p-6">
          <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <Briefcase className="h-7 w-7 text-violet-400" />
            Xodimlar
          </h1>
          <p className="text-sm leading-6 text-violet-100">
            Xodimlar paneli uchun login/parol berish va xodimlarni boshqarish bo&apos;limi.
          </p>
        </div>

        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 sm:p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Xodim topshiriqlari alohida sahifa</h2>
            <p className="text-sm text-violet-100">
              Topshiriq berish, bajarilganlarini ko&apos;rish va izohlarni tekshirish uchun alohida sahifa ochiladi.
            </p>
          </div>
          <Link
            href="/admin/xodimlar/topshiriqlar"
            className="group inline-flex h-11 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            Topshiriqlar sahifasini ochish
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/admin/xodimlar/jadval"
            className="ml-3 group inline-flex h-11 items-center gap-2 rounded-lg border border-violet-400/40 bg-transparent px-4 text-sm font-semibold text-violet-200 transition-colors hover:border-violet-300 hover:bg-violet-500/10 hover:text-white"
          >
            <Calendar className="h-4 w-4" />
            Jadval sahifasini ochish
          </Link>
        </div>

        <div className="rounded-xl border border-gray-700 bg-slate-800/80 p-4 sm:p-6">
          <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-white">Xodimlar ro&apos;yxati</h2>
              <p className="text-sm text-gray-400">Jami: {employees.length} ta xodim</p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              <Plus className="h-4 w-4" />
              Yangi xodim
            </button>
          </div>

          <div className="space-y-3">
            {employees.length === 0 ? (
              <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-8 text-center text-sm text-gray-400">
                Hozircha xodimlar mavjud emas
              </div>
            ) : (
              employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex flex-col items-start justify-between gap-4 rounded-lg border border-slate-700 bg-slate-900/30 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <p className="font-semibold text-white">{employee.name}</p>
                      {employee.isActive ? (
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                          Faol
                        </span>
                      ) : (
                        <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
                          Nofaol
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">@{employee.username}</p>
                    <p className="text-xs text-violet-300">{employeeTypeLabel(employee.employeeType)}</p>
                    <p className="text-xs text-gray-500">{employee.phone || 'Telefon yo\'q'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(employee)}
                      className="rounded-md bg-blue-500/20 p-2 text-blue-300 transition-colors hover:bg-blue-500/30"
                      title="Tahrirlash"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(employee)}
                      className="rounded-md bg-red-500/20 p-2 text-red-300 transition-colors hover:bg-red-500/30"
                      title="O'chirish"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-700 p-4">
              <h3 className="text-lg font-semibold text-white">
                {editingEmployee ? 'Xodimni tahrirlash' : 'Yangi xodim'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded p-1 text-gray-400 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 p-4">
              <div>
                <label className="mb-1 block text-sm text-gray-300">Username *</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 text-white outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-300">Ism *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 text-white outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-300">
                  Parol {editingEmployee ? '(o\'zgartirish uchun kiriting)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingEmployee}
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 pr-10 text-white outline-none focus:border-violet-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-300">Telefon</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 text-white outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-300">Xodim turi *</label>
                <select
                  required
                  value={form.employeeType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      employeeType: e.target.value as EmployeeType,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 text-white outline-none focus:border-violet-500"
                >
                  {EMPLOYEE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {employeeTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-violet-500"
                />
                Faol
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
