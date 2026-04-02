import { jsPDF } from 'jspdf'
import type { StipendProgramCode } from '@/lib/stipendiya'
import { stipendMeta } from '@/lib/stipendiya'

type Rgb = [number, number, number]

export type StipendRecipientPdfRow = {
  /** Guruh nomi (masalan KCH-D) */
  group: string
  /** O‘quvchining to‘liq ismi */
  name: string
}

/** PDF uchun har dasturning o‘zidagi rang palitrasi */
const PDF_THEME: Record<
  StipendProgramCode,
  { header: Rgb; rowAlt: Rgb; ink: Rgb; rule: Rgb }
> = {
  SULTONOV: {
    header: [180, 83, 9],
    rowAlt: [255, 250, 235],
    ink: [69, 26, 3],
    rule: [251, 191, 36],
  },
  EXCELLENT: {
    header: [109, 40, 217],
    rowAlt: [245, 243, 255],
    ink: [49, 10, 101],
    rule: [196, 181, 253],
  },
  RASH_UZ: {
    header: [3, 105, 161],
    rowAlt: [240, 249, 255],
    ink: [12, 74, 110],
    rule: [125, 211, 252],
  },
  IQMAX: {
    header: [4, 120, 87],
    rowAlt: [236, 253, 245],
    ink: [6, 78, 59],
    rule: [52, 211, 153],
  },
}

function safeFilenamePart(s: string): string {
  return s
    .trim()
    .replace(/[/\\?%*:|"<>#]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'stipendiya'
}

function sortRows(rows: StipendRecipientPdfRow[]): StipendRecipientPdfRow[] {
  return [...rows].sort((a, b) => {
    const g = a.group.localeCompare(b.group, 'uz')
    if (g !== 0) return g
    return a.name.localeCompare(b.name, 'uz')
  })
}

/**
 * Stipendiya turiga qarab guruh + ism (PDF).
 * Summa, tartib raqami va jami son ko‘rsatilmaydi.
 */
export function downloadStipendRecipientListPdf(
  program: StipendProgramCode,
  rows: StipendRecipientPdfRow[]
): void {
  const meta = stipendMeta(program)
  if (!meta) return

  const t = PDF_THEME[program]
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  const pageH = 297
  const margin = 16
  const bottomReserve = 14
  const lineH = 6.8
  const titleBandH = 26
  const colGuruhW = 48
  const colIsmX = margin + colGuruhW + 4
  const ismMaxW = pageW - margin - colIsmX

  const sorted = sortRows(rows)

  const dateStr = new Date().toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const dateShort = new Date().toISOString().slice(0, 10)

  let page = 1

  const drawFooter = () => {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(110, 110, 110)
    doc.text(
      'rash.uz — stipendiya olganlar ro‘yxati (ichki hujjat)',
      pageW / 2,
      pageH - 8,
      { align: 'center' }
    )
    doc.text(`Sahifa ${page}`, pageW - margin, pageH - 8, { align: 'right' })
  }

  const drawMainHeader = () => {
    doc.setFillColor(...t.header)
    doc.rect(0, 0, pageW, titleBandH, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text(meta.title, margin, 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.text(`Tuzilgan sana: ${dateStr}`, margin, 20)
  }

  const drawContinuationBar = () => {
    doc.setFillColor(...t.header)
    doc.rect(0, 0, pageW, 9, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(`${meta.title} (davom)`, margin, 6.2)
  }

  const drawTableHeader = (headerY: number) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...t.ink)
    doc.text('Guruh', margin, headerY)
    doc.text('O‘quvchi', colIsmX, headerY)
    doc.setDrawColor(...t.rule)
    doc.setLineWidth(0.35)
    doc.line(margin, headerY + 1.8, pageW - margin, headerY + 1.8)
  }

  drawMainHeader()
  let y = titleBandH + 6

  if (sorted.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(11)
    doc.setTextColor(90, 90, 90)
    doc.text('Hozircha ushbu turdagi stipendiya olganlar ro‘yxati bo‘sh.', margin, y + 4)
    drawFooter()
    doc.save(`${safeFilenamePart(`stipendiya-${program}-${dateShort}`)}.pdf`)
    return
  }

  drawTableHeader(y)
  y += 9

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i]
    const gLines = doc.splitTextToSize(row.group, colGuruhW)
    const nLines = doc.splitTextToSize(row.name, ismMaxW)
    const lineCount = Math.max(gLines.length, nLines.length)
    const blockH = Math.max(lineH, lineCount * 5 + 0.5)

    if (y + blockH > pageH - bottomReserve) {
      drawFooter()
      doc.addPage()
      page += 1
      drawContinuationBar()
      y = 14
      drawTableHeader(y)
      y += 9
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
    }

    if (i % 2 === 0) {
      doc.setFillColor(...t.rowAlt)
      doc.rect(margin - 1.5, y - 4.2, pageW - 2 * margin + 3, blockH + 1.2, 'F')
    }

    doc.setTextColor(35, 35, 35)
    doc.text(gLines, margin, y)
    doc.text(nLines, colIsmX, y)
    y += blockH
  }

  drawFooter()
  doc.save(`${safeFilenamePart(`stipendiya-${program}-${dateShort}`)}.pdf`)
}
