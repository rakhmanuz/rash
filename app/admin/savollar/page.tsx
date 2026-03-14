'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { ClipboardList, Download, BookOpen, Users } from 'lucide-react'
import { jsPDF } from 'jspdf'

interface Group {
  id: string
  name: string
  enrollments: Array<{
    id: string
    student: {
      id: string
      studentId: string
      user: {
        name: string
        username: string
      }
    }
  }>
}

export default function SavollarPage() {
  const { data: session } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  useEffect(() => {
    fetch('/api/admin/groups')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setGroups(data || []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false))
  }, [])

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const selectAll = () => {
    if (selectedGroupIds.size === groups.length) {
      setSelectedGroupIds(new Set())
    } else {
      setSelectedGroupIds(new Set(groups.map((g) => g.id)))
    }
  }

  const selectedGroups = groups.filter((g) => selectedGroupIds.has(g.id))
  const totalStudents = selectedGroups.reduce(
    (sum, g) => sum + (g.enrollments?.filter((e) => e.student).length || 0),
    0
  )

  const drawWatermark = (_doc: jsPDF, pageW: number, pageH: number) => {
    const dpi = 3
    const w = Math.round(pageW * dpi)
    const h = Math.round(pageH * dpi)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return Promise.resolve()
    ctx.fillStyle = 'rgba(140, 140, 140, 0.4)'
    ctx.font = 'bold 26px Helvetica, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const angle = (-45 * Math.PI) / 180
    const watermarkText = 'EXCELLENT 100'
    const minGap = 195
    const pad = 120
    const positions: { x: number; y: number }[] = []
    const maxCount = 15
    const maxAttempts = 200
    for (let i = 0; i < maxCount; i++) {
      let placed = false
      for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
        const x = pad + Math.random() * (w - 2 * pad)
        const y = pad + Math.random() * (h - 2 * pad)
        const tooClose = positions.some(
          (p) => Math.hypot(p.x - x, p.y - y) < minGap
        )
        if (!tooClose) {
          positions.push({ x, y })
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(angle)
          ctx.fillText(watermarkText, 0, 0)
          ctx.restore()
          placed = true
        }
      }
    }
    const dataUrl = canvas.toDataURL('image/png')
    _doc.addImage(dataUrl, 'PNG', 0, 0, pageW, pageH)
    return Promise.resolve()
  }

  const generatePdf = async () => {
    if (totalStudents === 0) return
    setDownloading(true)

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const [y, m, d] = selectedDate.split('-').map(Number)
    const sanaStr = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
    const pageW = 210
    const pageH = 297
    const margin = 5
    const fontSize = 14
    const answerLinesPerCol = 10
    const headerH = 34
    const gridTop = headerH + 4
    const gridH = pageH - gridTop - margin
    const contentW = pageW - 2 * margin
    const colW = contentW / 2
    const cellH = gridH / answerLinesPerCol
    const col2Start = margin + colW

    doc.setFontSize(fontSize)
    doc.setFont('helvetica', 'normal')

    const drawLabelValue = (label: string, value: string, x: number, y: number) => {
      doc.setFontSize(fontSize)
      doc.text(label, x, y)
      doc.text(value, x + doc.getTextWidth(label), y)
    }

    const drawAnswerBlock = () => {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', 'normal')
      const sanaY = gridTop - 2
      doc.setFontSize(18)
      doc.text(sanaStr, pageW / 2, sanaY, { align: 'center' })
      doc.setFontSize(fontSize)
      doc.setLineWidth(0.3)
      doc.setDrawColor(0, 0, 0)
      for (let i = 0; i < answerLinesPerCol; i++) {
        const rowY = gridTop + i * cellH
        const leftNum = i + 1
        const rightNum = 11 + i
        doc.rect(margin, rowY, colW, cellH)
        doc.rect(col2Start, rowY, colW, cellH)
        doc.setFontSize(fontSize)
        doc.text(`${leftNum})`, margin + 4, rowY + cellH / 2 + 2)
        doc.text(`${rightNum})`, col2Start + 4, rowY + cellH / 2 + 2)
      }
    }

    let pageIndex = 0
    for (const group of selectedGroups) {
      const students = (group.enrollments || []).filter((e) => e?.student)
      for (const enrollment of students) {
        if (pageIndex > 0) doc.addPage()
        await drawWatermark(doc, pageW, pageH)
        const student = enrollment.student
        const name = student?.user?.name || '—'
        const groupName = group.name || '—'
        const idNum = student?.studentId ?? '—'

        doc.setDrawColor(0, 0, 0)
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.text('rash.uz — EXCELLENT 100 raqamli nazorat tizimi', pageW / 2, 10, { align: 'center' })
        doc.setFontSize(fontSize)
        doc.setLineWidth(0.5)
        doc.line(margin, 14, pageW - margin, 14)

        const infoY = 19
        const infoStep = 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(fontSize)
        drawLabelValue('Ism Familiya: ', name, margin, infoY)
        drawLabelValue('Guruh: ', groupName, margin, infoY + infoStep)
        drawLabelValue('ID raqami: ', idNum, margin, infoY + infoStep * 2)

        drawAnswerBlock()

        pageIndex++
      }
    }

    doc.save('yozma-ish-titullar.pdf')
    setDownloading(false)
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Savollar — Yozma ish titullari</h1>
          <p className="text-sm sm:text-base text-gray-400">
            Guruhlarni tanlang va A4 titullarni yuklab oling. Har bir titulda o&apos;quvchi ismi, guruhi va ID raqami bo&apos;ladi.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto" />
            <p className="mt-4 text-gray-400">Yuklanmoqda...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-xl border border-gray-700">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Guruhlar topilmadi</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={selectAll}
                  className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-slate-700 text-sm font-medium"
                >
                  {selectedGroupIds.size === groups.length ? 'Barchasini bekor qilish' : 'Barcha guruhlarni tanlash'}
                </button>
                <label className="flex items-center gap-2 text-gray-300 text-sm">
                  <span>Sana (kun/oy/yil):</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-slate-800 border border-gray-600 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </label>
              </div>
              {selectedGroupIds.size > 0 && (
                <div className="flex items-center gap-4 text-gray-300 text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {selectedGroupIds.size} guruh, {totalStudents} ta o&apos;quvchi
                  </span>
                  <button
                    onClick={generatePdf}
                    disabled={totalStudents === 0 || downloading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    {downloading ? 'Yuklanmoqda...' : 'Titullarni yuklab olish'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => {
                const count = (group.enrollments || []).filter((e) => e?.student).length
                const isSelected = selectedGroupIds.has(group.id)
                return (
                  <label
                    key={group.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-green-500/10 border-green-500/50'
                        : 'bg-slate-800/90 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleGroup(group.id)}
                      className="w-5 h-5 rounded border-gray-600 text-green-500 focus:ring-green-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{group.name}</p>
                      <p className="text-sm text-gray-400">{count} ta o&apos;quvchi</p>
                    </div>
                    <ClipboardList className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </label>
                )
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
