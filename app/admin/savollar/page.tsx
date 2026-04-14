'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useEffect, useState } from 'react'
import { Download, BookOpen, Users, ScanLine, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { downloadOmrBlankPdf } from '@/lib/omrBlankPdf'

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

function sanitizePdfFilename(name: string): string {
  const s = name
    .trim()
    .replace(/[/\\?%*:|"<>#]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return s.slice(0, 100) || 'guruh'
}

function buildTitulPdfFilename(groups: Group[]): string {
  if (groups.length === 0) return 'titullar.pdf'
  if (groups.length === 1) return `${sanitizePdfFilename(groups[0].name)}.pdf`
  const parts = groups.map((g) => sanitizePdfFilename(g.name))
  const joined = parts.join('-')
  if (joined.length <= 120) return `${joined}.pdf`
  return `${parts[0]}-va-yana-${groups.length - 1}-guruh.pdf`
}

export default function SavollarPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [omrTopic, setOmrTopic] = useState('Mavzu 1')
  const [omrSection, setOmrSection] = useState("Bo'lim 1")
  const [omrScanFile, setOmrScanFile] = useState<File | null>(null)
  const [omrAnswerKey, setOmrAnswerKey] = useState('')
  const [omrScanning, setOmrScanning] = useState(false)
  const [omrScanResult, setOmrScanResult] = useState<{
    rollRead: string
    rollAmbiguous: boolean
    correctCount: number
    totalQuestions: number
    thresholdUsed: number
    answers: Array<{
      question: number
      detected: string | null
      key: string
      isCorrect: boolean
    }>
  } | null>(null)
  const [omrScanError, setOmrScanError] = useState<string | null>(null)

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

  const generatePdfForGroups = async (targetGroups: Group[]) => {
    const count = targetGroups.reduce(
      (sum, g) => sum + (g.enrollments?.filter((e) => e.student).length || 0),
      0
    )
    if (count === 0) return
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
    for (const group of targetGroups) {
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

    doc.save(buildTitulPdfFilename(targetGroups))
    setDownloading(false)
  }

  const generatePdf = () => generatePdfForGroups(selectedGroups)

  const runOmrScan = async () => {
    setOmrScanError(null)
    setOmrScanResult(null)
    if (!omrScanFile) {
      setOmrScanError('Skan yoki foto (rasm) tanlang.')
      return
    }
    const key = omrAnswerKey.replace(/\s+/g, '').toUpperCase()
    if (key.length !== 20 || !/^[A-F]+$/.test(key)) {
      setOmrScanError('Javob kaliti: aynan 20 ta A–F harfi (masalan, generator PDF bilan bir xil tartibda).')
      return
    }
    setOmrScanning(true)
    try {
      const fd = new FormData()
      fd.append('file', omrScanFile)
      fd.append('answerKey', key)
      const res = await fetch('/api/admin/omr-scan', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setOmrScanError(data.error || 'Xato')
        return
      }
      setOmrScanResult({
        rollRead: data.rollRead,
        rollAmbiguous: data.rollAmbiguous,
        correctCount: data.correctCount,
        totalQuestions: data.totalQuestions,
        thresholdUsed: data.thresholdUsed,
        answers: data.answers,
      })
    } catch {
      setOmrScanError('Tarmoq xatosi')
    } finally {
      setOmrScanning(false)
    }
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Savollar</h1>
          <p className="text-sm sm:text-base text-gray-400">
            Yozma ish titullari va chop etiladigan OMR test varaqasi.
          </p>
        </div>

        <div className="bg-slate-800/90 rounded-xl border border-gray-700 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400">
              <ScanLine className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-white">Testlar (OMR)</h2>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-end">
            <div className="flex-1 min-w-[140px] max-w-xs">
              <label className="block text-xs text-gray-400 mb-1.5">Mavzu</label>
              <input
                type="text"
                value={omrTopic}
                onChange={(e) => setOmrTopic(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-gray-600 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Mavzu 1"
              />
            </div>
            <div className="flex-1 min-w-[140px] max-w-xs">
              <label className="block text-xs text-gray-400 mb-1.5">Bo&apos;lim</label>
              <input
                type="text"
                value={omrSection}
                onChange={(e) => setOmrSection(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-gray-600 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Bo'lim 1"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                downloadOmrBlankPdf({
                  topicTitle: omrTopic,
                  sectionTitle: omrSection,
                  filename: 'OMR-bosh-varaq.pdf',
                })
              }
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium text-sm transition-colors w-full sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Generator PDF
            </button>
          </div>
          <div className="border-t border-gray-700 pt-4 space-y-3">
            <h3 className="text-sm font-medium text-white">OMR tekshirish</h3>
            <p className="text-xs text-gray-500">
              To‘ldirilgan varaqni skaner yoki telefon rasmi sifatida yuklang. Tizim burchak markerlari va grid bo‘yicha
              doiralarni o‘qiydi (qorong‘ulik taxminan 40% dan yuqori bo‘lsa — belgilangan).
            </p>
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <div className="min-w-[200px]">
                <label className="block text-xs text-gray-400 mb-1">Rasm</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="block w-full text-sm text-gray-300 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white"
                  onChange={(e) => setOmrScanFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="flex-1 min-w-[220px] max-w-xl">
                <label className="block text-xs text-gray-400 mb-1">Javob kaliti (20 ta harf, 1–20 savol tartibi)</label>
                <input
                  type="text"
                  value={omrAnswerKey}
                  onChange={(e) => setOmrAnswerKey(e.target.value.toUpperCase().replace(/[^A-F]/g, '').slice(0, 20))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-gray-600 text-white font-mono text-sm tracking-wider focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="ABCDEFABCDEFABCDEFABCD"
                  maxLength={40}
                />
                <p className="text-xs text-gray-600 mt-1">{omrAnswerKey.replace(/\s/g, '').length}/20</p>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={omrScanning}
                  onClick={runOmrScan}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                >
                  {omrScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
                  Tekshirish
                </button>
              </div>
            </div>
            {omrScanError && <p className="text-sm text-red-400">{omrScanError}</p>}
            {omrScanResult && (
              <div className="rounded-lg border border-gray-600 bg-slate-900/50 p-4 space-y-3">
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="text-gray-300">
                    Rolik (o‘qilgan):{' '}
                    <span className="font-mono text-white">{omrScanResult.rollRead}</span>
                    {omrScanResult.rollAmbiguous && (
                      <span className="text-amber-400 ml-2">(ba’zi raqamlar shubhali)</span>
                    )}
                  </span>
                  <span className="text-gray-300">
                    Natija:{' '}
                    <span className="text-emerald-400 font-semibold">
                      {omrScanResult.correctCount}/{omrScanResult.totalQuestions}
                    </span>{' '}
                    to‘g‘ri
                  </span>
                  <span className="text-gray-500 text-xs">chegara: {omrScanResult.thresholdUsed}</span>
                </div>
                <div className="overflow-x-auto max-h-56 overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-700">
                        <th className="py-1 pr-2">Savol</th>
                        <th className="py-1 pr-2">O‘qilgan</th>
                        <th className="py-1 pr-2">Kalit</th>
                        <th className="py-1">Holat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {omrScanResult.answers.map((a) => (
                        <tr key={a.question} className="border-b border-gray-800">
                          <td className="py-1 pr-2 text-gray-400">{a.question}</td>
                          <td className="py-1 pr-2 font-mono">{a.detected ?? '—'}</td>
                          <td className="py-1 pr-2 font-mono text-gray-400">{a.key}</td>
                          <td className="py-1">
                            {a.isCorrect ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 inline" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400 inline" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-semibold text-white mb-1">Yozma ish titullari</h2>
          <p className="text-sm text-gray-400">
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
                    <button
                      type="button"
                      title="Faqat shu guruhingiz titullarini yuklab olish"
                      disabled={count === 0 || downloading}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        generatePdfForGroups([group])
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:text-green-400 hover:bg-slate-700/80 disabled:opacity-40 disabled:pointer-events-none flex-shrink-0"
                    >
                      <Download className="h-5 w-5" />
                    </button>
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
