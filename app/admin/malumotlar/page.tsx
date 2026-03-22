'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Contact2, Download, Edit, FileSpreadsheet, Search, Upload, X } from 'lucide-react'
import { formatBirthDateUz } from '@/lib/birth-date'

interface ContactItem {
  label: string
  phone: string
}

interface StudentRow {
  id: string
  studentId: string
  /** YYYY-MM-DD yoki null */
  birthDate: string | null
  address: string | null
  schoolClass: string | null
  school: string | null
  user: {
    name: string
    username: string
    phone?: string | null
    contacts?: ContactItem[]
  }
  currentGroupName?: string
}

const emptySlots = (): ContactItem[] => [
  { label: "O'quvchi", phone: '' },
  { label: 'Ota', phone: '' },
  { label: 'Ona', phone: '' },
]

export default function MalumotlarPage() {
  const { data: session } = useSession()
  const role = session?.user?.role === 'MANAGER' ? 'MANAGER' : 'ADMIN'

  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editing, setEditing] = useState<StudentRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [contactSlots, setContactSlots] = useState<ContactItem[]>(emptySlots)
  const [birthDate, setBirthDate] = useState('')
  const [address, setAddress] = useState('')
  const [schoolClass, setSchoolClass] = useState('')
  const [school, setSchool] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(
    null
  )

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/students?includeEnrollment=true')
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) =>
        s.user.name.toLowerCase().includes(q) ||
        s.user.username.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q)
    )
  }, [students, searchTerm])

  const openEdit = (s: StudentRow) => {
    setEditing(s)
    const cts = s.user.contacts || []
    const base = emptySlots()
    for (let i = 0; i < 3; i++) {
      if (cts[i]) {
        base[i] = {
          label: (cts[i].label && cts[i].label.trim()) || base[i].label,
          phone: cts[i].phone || '',
        }
      }
    }
    setContactSlots(base)
    setBirthDate(s.birthDate && String(s.birthDate).trim() !== '' ? String(s.birthDate).slice(0, 10) : '')
    setAddress(s.address || '')
    setSchoolClass(s.schoolClass || '')
    setSchool(s.school || '')
  }

  const closeEdit = () => {
    setEditing(null)
    setContactSlots(emptySlots())
    setBirthDate('')
    setAddress('')
    setSchoolClass('')
    setSchool('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/students/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactSlots,
          birthDate: birthDate.trim() === '' ? null : birthDate.trim().slice(0, 10),
          address: address.trim() || null,
          schoolClass: schoolClass.trim() || null,
          school: school.trim() || null,
        }),
      })
      if (res.ok) {
        closeEdit()
        fetchStudents()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Saqlashda xatolik')
      }
    } catch (err) {
      console.error(err)
      alert('Saqlashda xatolik')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch('/api/admin/malumotlar/excel-template')
      if (!res.ok) {
        alert('Shablon yuklab olishda xatolik')
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'malumotlar_shablon.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      alert('Shablon yuklab olishda xatolik')
    }
  }

  const handleDownloadPrefill = async () => {
    try {
      const res = await fetch('/api/admin/malumotlar/excel-template?prefill=1')
      if (!res.ok) {
        alert('Excel yuklab olishda xatolik')
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = "malumotlar_toldirilgan.xlsx"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      alert('Excel yuklab olishda xatolik')
    }
  }

  const handleImportMalumotlar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) {
      alert('Excel fayl tanlang!')
      return
    }
    setImporting(true)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      const res = await fetch('/api/admin/malumotlar/import', { method: 'POST', body: formData })
      const result = await res.json()
      if (res.ok) {
        setImportResult({
          success: result.success,
          failed: result.failed,
          errors: result.errors || [],
        })
        if (result.success > 0) fetchStudents()
      } else {
        alert(result.error || 'Import qilishda xatolik')
      }
    } catch (err) {
      console.error(err)
      alert('Import qilishda xatolik')
    } finally {
      setImporting(false)
    }
  }

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 sm:p-6 text-white flex items-center gap-3">
          <Contact2 className="h-8 w-8 shrink-0 opacity-90" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Ma&apos;lumotlar</h1>
            <p className="text-sm text-white/90 mt-0.5">
              O&apos;quvchilar telefonlari (kimniki), tug&apos;ilgan sana, manzil, sinf va maktab
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4 shrink-0" />
            Shablon (Excel)
          </button>
          <button
            type="button"
            onClick={handleDownloadPrefill}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 shrink-0" />
            Barcha o&apos;quvchilar (to&apos;ldirilgan)
          </button>
          <button
            type="button"
            onClick={() => {
              setShowImportModal(true)
              setImportFile(null)
              setImportResult(null)
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Upload className="h-4 w-4 shrink-0" />
            Excel yuklash
          </button>
        </div>

        <div className="bg-slate-800 rounded-xl border border-gray-700 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="search"
              placeholder="Ism, login yoki o'quvchi ID bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">O&apos;quvchilar topilmadi</div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-700 bg-slate-800/80">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      O&apos;quvchi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Telefonlar
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Tug&apos;ilgan sanasi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Manzil
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Sinf
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Maktab
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide w-24">
                      Amal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const phones = s.user.contacts || []
                    return (
                      <tr key={s.id} className="border-b border-gray-700/80 hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                          <div className="text-white font-medium">{s.user.name}</div>
                          <div className="text-xs text-gray-500">{s.studentId}</div>
                          {s.currentGroupName && (
                            <div className="text-xs text-blue-400 mt-0.5">{s.currentGroupName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {phones.filter((p) => p.phone).length ? (
                            <ul className="space-y-0.5">
                              {phones
                                .filter((p) => p.phone)
                                .map((p) => (
                                  <li key={p.label + p.phone}>
                                    <span className="text-gray-500">{p.label}:</span> {p.phone}
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {formatBirthDateUz(s.birthDate) ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300 max-w-[200px]">
                          {s.address ? (
                            <span className="line-clamp-2">{s.address}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{s.schoolClass || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-300 max-w-[180px]">
                          {s.school ? <span className="line-clamp-2">{s.school}</span> : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(s)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-blue-400 hover:bg-blue-500/15 rounded-lg text-sm"
                          >
                            <Edit className="h-4 w-4" />
                            Tahrir
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-lg my-8 shadow-xl">
              <div className="flex items-center justify-between p-5 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">
                  {editing.user.name}
                  <span className="block text-sm font-normal text-gray-400 mt-0.5">{editing.studentId}</span>
                </h2>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="text-gray-400 hover:text-white p-1"
                  aria-label="Yopish"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-5 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-2">Telefon raqamlari (3 ta, kimniki)</p>
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Kimniki (masalan: O'quvchi, Ota)"
                          value={contactSlots[i]?.label || ''}
                          onChange={(e) => {
                            const next = [...contactSlots]
                            next[i] = { ...next[i], label: e.target.value }
                            setContactSlots(next)
                          }}
                          className="sm:w-[140px] px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <input
                          type="tel"
                          placeholder="Telefon"
                          value={contactSlots[i]?.phone || ''}
                          onChange={(e) => {
                            const next = [...contactSlots]
                            next[i] = { ...next[i], phone: e.target.value }
                            setContactSlots(next)
                          }}
                          className="flex-1 px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Tug&apos;ilgan sanasi (kun, oy, yil)
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Manzili</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-y min-h-[72px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Sinfi</label>
                  <input
                    type="text"
                    placeholder="Masalan: 9-A"
                    value={schoolClass}
                    onChange={(e) => setSchoolClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Maktab</label>
                  <input
                    type="text"
                    placeholder="Maktab nomi"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="flex-1 py-2.5 border border-gray-600 rounded-lg text-gray-300 hover:bg-slate-700"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg text-white font-medium"
                  >
                    {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showImportModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
              <div className="flex items-center justify-between p-5 border-b border-gray-700 shrink-0">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-6 w-6 text-green-400" />
                  Excel orqali ma&apos;lumotlar
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                    setImportResult(null)
                  }}
                  className="text-gray-400 hover:text-white p-1"
                  aria-label="Yopish"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="bg-blue-500/15 border border-blue-500/40 rounded-lg p-4 text-sm text-gray-300 space-y-2">
                  <p className="text-white font-medium">Qo&apos;llanma</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>
                      <strong className="text-gray-200">Shablon</strong> — namuna qatorlar bilan; yoki{' '}
                      <strong className="text-gray-200">Barcha o&apos;quvchilar</strong> — joriy ma&apos;lumotlar
                      bilan.
                    </li>
                    <li>Birinchi qator (sarlavha) o&apos;zgartirilmasin; ustun tartibi saqlansin.</li>
                    <li>
                      Har bir qatorda <strong className="text-gray-200">O&apos;quvchi ID</strong> majburiy (tizimdagi
                      ID).
                    </li>
                    <li>
                      Tug&apos;ilgan sana: <code className="text-blue-300">YYYY-MM-DD</code> yoki{' '}
                      <code className="text-blue-300">DD.MM.YYYY</code>, yoki Excel sanasi.
                    </li>
                    <li>Bo&apos;sh &quot;Tug&apos;ilgan sana&quot; maydoni sanani o&apos;chiradi.</li>
                  </ol>
                </div>
                <form onSubmit={handleImportMalumotlar} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Excel fayl (.xlsx, .xls)</label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      required
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) {
                          setImportFile(f)
                          setImportResult(null)
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white file:text-sm"
                    />
                    {importFile && <p className="text-xs text-gray-500 mt-2">Tanlangan: {importFile.name}</p>}
                  </div>
                  {importResult && (
                    <div
                      className={`rounded-lg p-4 border ${
                        importResult.failed === 0
                          ? 'bg-green-500/15 border-green-500/40'
                          : 'bg-amber-500/15 border-amber-500/40'
                      }`}
                    >
                      <p className="text-green-400 text-sm font-medium">Muvaffaqiyatli: {importResult.success} ta</p>
                      {importResult.failed > 0 && (
                        <p className="text-red-400 text-sm mt-1">Xato: {importResult.failed} ta</p>
                      )}
                      {importResult.errors.length > 0 && (
                        <ul className="mt-2 max-h-36 overflow-y-auto text-xs text-red-300 list-disc list-inside space-y-0.5">
                          {importResult.errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowImportModal(false)
                        setImportFile(null)
                        setImportResult(null)
                      }}
                      className="flex-1 py-2.5 border border-gray-600 rounded-lg text-gray-300 hover:bg-slate-700"
                    >
                      Yopish
                    </button>
                    <button
                      type="submit"
                      disabled={!importFile || importing}
                      className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg text-white font-medium"
                    >
                      {importing ? 'Yuklanmoqda...' : 'Import qilish'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
