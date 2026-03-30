import { jsPDF } from 'jspdf'
import {
  OMR_PAGE_MM,
  OMR_MARGIN_MM,
  OMR_BUBBLE_DIAMETER_MM,
  OMR_PITCH_MM,
  omrCornerMarkersMm,
  omrLayoutAnchorsMm,
  rollBubbleCenterMm,
  answerBubbleCenterMm,
} from '@/lib/omrLayoutSpec'

const R = OMR_BUBBLE_DIAMETER_MM / 2
const OPT = ['A', 'B', 'C', 'D', 'E', 'F'] as const

/**
 * OMR varaqasi: mm da qat‘iy grid, 4 burchak marker (#000), 20 qator × 6 variant.
 * Koordinatalar `omrLayoutSpec.ts` bilan bir xil manba.
 */
export function downloadOmrBlankPdf(options: {
  topicTitle?: string
  sectionTitle?: string
  filename?: string
} = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = OMR_PAGE_MM.w
  const pageH = OMR_PAGE_MM.h
  const margin = OMR_MARGIN_MM
  const topic = options.topicTitle?.trim() || 'Mavzu 1'
  const section = options.sectionTitle?.trim() || "Bo'lim 1"
  const a = omrLayoutAnchorsMm()

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.35)
  doc.rect(margin, margin, pageW - 2 * margin, pageH - 2 * margin)

  doc.setFillColor(0, 0, 0)
  for (const m of omrCornerMarkersMm()) {
    doc.rect(m.x, m.y, m.size, m.size, 'F')
  }

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.2)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Rolik raqami', margin + 4, a.titulTop)

  doc.setFontSize(12)
  doc.text(topic, pageW / 2, a.titulTop, { align: 'center' })
  doc.setFontSize(10)
  doc.text(section, pageW / 2, a.titulTop + 5.5, { align: 'center' })

  doc.setLineWidth(0.25)
  doc.line(margin + 2, a.separatorY, pageW - margin - 2, a.separatorY)

  doc.setFont('helvetica', 'normal')
  const writeBoxW = 6
  const writeGap = 1.5
  for (let c = 0; c < 5; c++) {
    doc.rect(margin + 4 + c * (writeBoxW + writeGap), a.writeRowY, writeBoxW, a.writeBoxH)
  }

  doc.setFontSize(8)
  for (let d = 0; d < 10; d++) {
    doc.text(String(d), margin + 3, a.gridTop + d * OMR_PITCH_MM + OMR_PITCH_MM * 0.65)
  }

  for (let col = 0; col < 5; col++) {
    for (let digit = 0; digit < 10; digit++) {
      const [cx, cy] = rollBubbleCenterMm(col, digit)
      doc.circle(cx, cy, R, 'S')
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  for (let o = 0; o < 6; o++) {
    const [cx] = answerBubbleCenterMm(1, o)
    doc.text(OPT[o], cx, a.gridTop + 4, { align: 'center' })
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  for (let q = 1; q <= 20; q++) {
    const [, cy] = answerBubbleCenterMm(q, 0)
    doc.text(String(q), a.qNumX, cy + 1.2, { align: 'right' })
    for (let o = 0; o < 6; o++) {
      const [cx, cyy] = answerBubbleCenterMm(q, o)
      doc.circle(cx, cyy, R, 'S')
    }
  }

  const idBottom = a.gridTop + 10 * OMR_PITCH_MM
  const ansBottom = a.firstAnswerRowCy + 19 * OMR_PITCH_MM + R
  const contentBottom = Math.max(idBottom, ansBottom)
  let iy = contentBottom + 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  doc.text("Qog'ozda qanday to'ldirish", margin + 2, iy)
  iy += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  const guide = [
    "Rolik: 5 katakchaga ID yozing; har ustunda 0–9 dan bittasini to'liq qoraytiring.",
    "Javoblar: har savolda A–F dan faqat bitta doira. Doira diametri ~6 mm — ichini to'liq disk qiling.",
    "Skaner: burchakdagi qora kvadratlar va grid bo'yicha hizalanadi; >~40% qora piksel = belgilangan deb olinadi.",
  ]
  const maxW = pageW - 2 * margin - 4
  for (const para of guide) {
    const wrapped = doc.splitTextToSize(para, maxW)
    doc.text(wrapped, margin + 2, iy)
    iy += wrapped.length * 3.6 + 2
  }

  doc.save(options.filename?.trim() || 'OMR-bosh-varaq.pdf')
}
