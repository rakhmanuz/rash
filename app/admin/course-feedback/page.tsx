'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, MessageSquare, Save, X, Download, Upload } from 'lucide-react'
import * as XLSX from 'xlsx'

interface FeedbackTemplate {
  id: string
  metricType: string
  minValue: number
  maxValue: number | null
  feedbackText: string
  createdAt: string
  updatedAt: string
}

const metricTypes = [
  { value: 'attendance', label: 'Oylik davomat' },
  { value: 'assignment', label: 'Uyda topshiriq' },
  { value: 'mastery', label: 'O\'zlashtirish daraja' },
  { value: 'ability', label: 'O\'quvchi qobilyati' },
]

export default function CourseFeedbackPage() {
  const { data: session } = useSession()
  const [templates, setTemplates] = useState<FeedbackTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    metricType: 'attendance',
    minValue: '',
    maxValue: '',
    feedbackText: '',
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/course-feedback')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      alert('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/course-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          minValue: parseFloat(formData.minValue),
          maxValue: formData.maxValue ? parseFloat(formData.maxValue) : null,
        }),
      })

      if (response.ok) {
        alert('Fikr muvaffaqiyatli qo\'shildi!')
        setShowAddModal(false)
        setFormData({ metricType: 'attendance', minValue: '', maxValue: '', feedbackText: '' })
        fetchTemplates()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error adding template:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      const template = templates.find(t => t.id === id)
      if (!template) return

      const response = await fetch(`/api/admin/course-feedback/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metricType: template.metricType,
          minValue: template.minValue,
          maxValue: template.maxValue,
          feedbackText: template.feedbackText,
        }),
      })

      if (response.ok) {
        alert('Fikr muvaffaqiyatli yangilandi!')
        setEditingId(null)
        fetchTemplates()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error updating template:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Fikrni o\'chirishni tasdiqlaysizmi?')) return

    try {
      const response = await fetch(`/api/admin/course-feedback/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Fikr muvaffaqiyatli o\'chirildi!')
        fetchTemplates()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const startEdit = (template: FeedbackTemplate) => {
    setEditingId(template.id)
  }

  const cancelEdit = () => {
    setEditingId(null)
    fetchTemplates()
  }

  const updateTemplateField = (id: string, field: string, value: any) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ))
  }

  // Excel shablon yuklab olish
  const downloadTemplate = () => {
    const templateData = [
      {
        'Ko\'rsatkich turi': 'attendance',
        'Minimal qiymat (%)': 0,
        'Maksimal qiymat (%)': 75,
        'Fikr matni': 'Farzandingiz ko\'p dars qoldiriyapti'
      },
      {
        'Ko\'rsatkich turi': 'attendance',
        'Minimal qiymat (%)': 75,
        'Maksimal qiymat (%)': 99,
        'Fikr matni': 'Davomat yaxshi, lekin yanada yaxshilash mumkin'
      },
      {
        'Ko\'rsatkich turi': 'attendance',
        'Minimal qiymat (%)': 99,
        'Maksimal qiymat (%)': '',
        'Fikr matni': 'Davomat a\'lo darajada'
      },
      {
        'Ko\'rsatkich turi': 'assignment',
        'Minimal qiymat (%)': 0,
        'Maksimal qiymat (%)': 40,
        'Fikr matni': 'Uy vazifalarini to\'liq bajarmayapti'
      },
      {
        'Ko\'rsatkich turi': 'assignment',
        'Minimal qiymat (%)': 40,
        'Maksimal qiymat (%)': 75,
        'Fikr matni': 'Vazifalarham o\'ziga yarasha keliyapti faqat daftar to\'ldirish bilan vaqt o\'tiyapdi'
      },
      {
        'Ko\'rsatkich turi': 'assignment',
        'Minimal qiymat (%)': 75,
        'Maksimal qiymat (%)': '',
        'Fikr matni': 'Uy vazifalari a\'lo darajada bajarilmoqda'
      },
      {
        'Ko\'rsatkich turi': 'mastery',
        'Minimal qiymat (%)': 0,
        'Maksimal qiymat (%)': 50,
        'Fikr matni': 'Fikr boshqa yoqda chalg\'iganligi bunga sabab bo\'lishi mumkin'
      },
      {
        'Ko\'rsatkich turi': 'mastery',
        'Minimal qiymat (%)': 50,
        'Maksimal qiymat (%)': 81,
        'Fikr matni': 'Darslarni o\'zlashtirish o\'rtacha darajada'
      },
      {
        'Ko\'rsatkich turi': 'mastery',
        'Minimal qiymat (%)': 81,
        'Maksimal qiymat (%)': '',
        'Fikr matni': 'Darslarni a\'lo darajada o\'zlashtirmoqda'
      },
      {
        'Ko\'rsatkich turi': 'ability',
        'Minimal qiymat (%)': 0,
        'Maksimal qiymat (%)': 30,
        'Fikr matni': 'Masulyat nolga teng'
      },
      {
        'Ko\'rsatkich turi': 'ability',
        'Minimal qiymat (%)': 30,
        'Maksimal qiymat (%)': 70,
        'Fikr matni': 'Yozma ishlar o\'rtacha darajada'
      },
      {
        'Ko\'rsatkich turi': 'ability',
        'Minimal qiymat (%)': 70,
        'Maksimal qiymat (%)': '',
        'Fikr matni': 'Yozma ishlar a\'lo darajada'
      },
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Kurs Fikrlari')
    
    // Column width'ni sozlash
    ws['!cols'] = [
      { wch: 20 }, // Ko'rsatkich turi
      { wch: 18 }, // Minimal qiymat
      { wch: 18 }, // Maksimal qiymat
      { wch: 60 }, // Fikr matni
    ]

    XLSX.writeFile(wb, 'kurs_fikrlari_shablon.xlsx')
  }

  // Excel fayl yuklash va import qilish
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Faqat Excel fayllar (.xlsx, .xls) qabul qilinadi')
      return
    }

    setUploading(true)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        alert('Excel fayl bo\'sh yoki noto\'g\'ri formatda')
        return
      }

      // Ma'lumotlarni tekshirish va formatlash
      const templatesToImport: any[] = []
      const errors: string[] = []

      // Metric type mapping (o'zbek va ingliz tillari)
      const metricTypeMap: Record<string, string> = {
        'attendance': 'attendance',
        'oylik davomat': 'attendance',
        'davomat': 'attendance',
        'assignment': 'assignment',
        'uyda topshiriq': 'assignment',
        'topshiriq': 'assignment',
        'mastery': 'mastery',
        'o\'zlashtirish daraja': 'mastery',
        'o\'zlashtirish': 'mastery',
        'ability': 'ability',
        'o\'quvchi qobilyati': 'ability',
        'qobilyat': 'ability',
      }

      jsonData.forEach((row: any, index: number) => {
        // Try different possible column names (handle apostrophe variations)
        const metricTypeKey1 = 'Ko\'rsatkich turi'
        const metricTypeKey2 = 'Ko\'rsatkich turi'
        const metricTypeRaw = String(
          row[metricTypeKey1] || 
          row[metricTypeKey2] || 
          ''
        ).trim().toLowerCase()
        const metricType = metricTypeMap[metricTypeRaw] || metricTypeRaw
        
        const minValueKey1 = 'Minimal qiymat (%)'
        const minValueKey2 = 'Minimal qiymat'
        const minValue = parseFloat(
          row[minValueKey1] || 
          row[minValueKey2] || 
          ''
        )
        
        const maxValueKey1 = 'Maksimal qiymat (%)'
        const maxValueKey2 = 'Maksimal qiymat'
        const maxValueStr = String(
          row[maxValueKey1] || 
          row[maxValueKey2] || 
          ''
        ).trim()
        const maxValue = maxValueStr === '' || maxValueStr === null ? null : parseFloat(maxValueStr)
        
        const feedbackKey = 'Fikr matni'
        const feedbackText = String(
          row[feedbackKey] || 
          ''
        ).trim()

        // Validation
        if (!metricType || !['attendance', 'assignment', 'mastery', 'ability'].includes(metricType)) {
          errors.push(`Qator ${index + 2}: Noto'g'ri ko'rsatkich turi (${metricTypeRaw}). Qabul qilinadigan: attendance, assignment, mastery, ability`)
          return
        }

        if (isNaN(minValue) || minValue < 0 || minValue > 100) {
          errors.push(`Qator ${index + 2}: Noto'g'ri minimal qiymat`)
          return
        }

        if (maxValue !== null && (isNaN(maxValue) || maxValue < minValue || maxValue > 100)) {
          errors.push(`Qator ${index + 2}: Noto'g'ri maksimal qiymat`)
          return
        }

        if (!feedbackText) {
          errors.push(`Qator ${index + 2}: Fikr matni bo'sh`)
          return
        }

        templatesToImport.push({
          metricType,
          minValue,
          maxValue,
          feedbackText,
        })
      })

      if (errors.length > 0) {
        alert(`Xatoliklar:\n${errors.join('\n')}`)
        setUploading(false)
        return
      }

      // API orqali saqlash
      let successCount = 0
      let errorCount = 0

      for (const template of templatesToImport) {
        try {
          const response = await fetch('/api/admin/course-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template),
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      }

      if (successCount > 0) {
        alert(`${successCount} ta fikr muvaffaqiyatli import qilindi${errorCount > 0 ? `, ${errorCount} ta xatolik` : ''}`)
        fetchTemplates()
      } else {
        alert('Hech qanday fikr import qilinmadi')
      }
    } catch (error) {
      console.error('Error importing file:', error)
      alert('Fayl import qilishda xatolik yuz berdi')
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.metricType]) {
      acc[template.metricType] = []
    }
    acc[template.metricType].push(template)
    return acc
  }, {} as Record<string, FeedbackTemplate[]>)

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 break-words">Kurs Fikrlari</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-400 break-words">O'quvchilar uchun kurs fikrlarini sozlang</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadTemplate}
              className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs sm:text-sm md:text-base flex-shrink-0"
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              <span className="whitespace-nowrap hidden sm:inline">Shablon Yuklab Olish</span>
              <span className="whitespace-nowrap sm:hidden">Shablon</span>
            </button>
            <label className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors cursor-pointer text-xs sm:text-sm md:text-base flex-shrink-0">
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              <span className="whitespace-nowrap">{uploading ? 'Yuklanmoqda...' : 'Excel Yuklash'}</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <button
              onClick={() => {
                setFormData({ metricType: 'attendance', minValue: '', maxValue: '', feedbackText: '' })
                setShowAddModal(true)
              }}
              className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-xs sm:text-sm md:text-base flex-shrink-0"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              <span className="whitespace-nowrap hidden sm:inline">Yangi Fikr</span>
              <span className="whitespace-nowrap sm:hidden">Qo'shish</span>
            </button>
          </div>
        </div>

        {/* Templates List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Yuklanmoqda...</p>
          </div>
        ) : Object.keys(groupedTemplates).length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-lg border border-gray-700">
            <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Fikrlar topilmadi</p>
          </div>
        ) : (
          <div className="space-y-6">
            {metricTypes.map((metric) => {
              const typeTemplates = groupedTemplates[metric.value] || []
              if (typeTemplates.length === 0) return null

              return (
                <div key={metric.value} className="bg-slate-800 rounded-lg border border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">{metric.label}</h2>
                  <div className="space-y-3">
                    {typeTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="bg-slate-700 rounded-lg p-4 border border-gray-600"
                      >
                        {editingId === template.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Minimal qiymat (%)
                                </label>
                                <input
                                  type="number"
                                  value={template.minValue}
                                  onChange={(e) => updateTemplateField(template.id, 'minValue', parseFloat(e.target.value) || 0)}
                                  className="w-full px-3 py-2 bg-slate-600 border border-gray-500 rounded-lg text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Maksimal qiymat (%) (ixtiyoriy)
                                </label>
                                <input
                                  type="number"
                                  value={template.maxValue || ''}
                                  onChange={(e) => updateTemplateField(template.id, 'maxValue', e.target.value ? parseFloat(e.target.value) : null)}
                                  className="w-full px-3 py-2 bg-slate-600 border border-gray-500 rounded-lg text-white"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Fikr matni
                              </label>
                              <textarea
                                value={template.feedbackText}
                                onChange={(e) => updateTemplateField(template.id, 'feedbackText', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 bg-slate-600 border border-gray-500 rounded-lg text-white"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdate(template.id)}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
                              >
                                <Save className="h-4 w-4" />
                                <span>Saqlash</span>
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                              >
                                <X className="h-4 w-4" />
                                <span>Bekor</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-sm text-gray-400">
                                  {template.minValue}%
                                  {template.maxValue !== null ? ` - ${template.maxValue}%` : '+'}
                                </span>
                              </div>
                              <p className="text-white">{template.feedbackText}</p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() => startEdit(template)}
                                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(template.id)}
                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-lg border border-gray-700 w-full max-w-md p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Yangi Fikr</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ko'rsatkich turi *
                  </label>
                  <select
                    required
                    value={formData.metricType}
                    onChange={(e) => setFormData({ ...formData, metricType: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {metricTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Minimal qiymat (%) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.minValue}
                      onChange={(e) => setFormData({ ...formData, minValue: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Maksimal qiymat (%) (ixtiyoriy)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.maxValue}
                      onChange={(e) => setFormData({ ...formData, maxValue: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Cheksiz uchun bo'sh"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fikr matni *
                  </label>
                  <textarea
                    required
                    value={formData.feedbackText}
                    onChange={(e) => setFormData({ ...formData, feedbackText: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Masalan: Farzandingiz ko'p dars qoldiriyapti"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Qo'shish
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
