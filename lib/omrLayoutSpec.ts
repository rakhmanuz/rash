/**
 * OMR forma: mm birlikda qat'iy layout (print 1:1, A4).
 * Skaner: 4 burchak marker → homography → bu koordinatalar “nominal” markazlar.
 */

export const OMR_PAGE_MM = { w: 210, h: 297 } as const

export const OMR_MARGIN_MM = 10

/** To‘liq qora kvadrat (#000), burchaklarda hizalash */
export const OMR_MARKER_MM = 3

/** Standart: diametr 5–7 mm, oralig‘i 2–3 mm */
export const OMR_BUBBLE_DIAMETER_MM = 6
export const OMR_BUBBLE_GAP_MM = 2.5

/** Markazdan markazga masofa */
export const OMR_PITCH_MM = OMR_BUBBLE_DIAMETER_MM + OMR_BUBBLE_GAP_MM

/** Bo‘yalgan deb hisoblash uchun tavsiya (piksel foizi) */
export const OMR_FILL_THRESHOLD_SUGGESTED = 0.4

const R = OMR_BUBBLE_DIAMETER_MM / 2
const P = OMR_PITCH_MM
const M = OMR_MARGIN_MM
const W = OMR_PAGE_MM.w
const H = OMR_PAGE_MM.h
const MK = OMR_MARKER_MM

/** 4 burchak marker — to‘g‘ri burchak (x, y) = yuqori-chap burchagi */
export function omrCornerMarkersMm(): ReadonlyArray<{ x: number; y: number; size: number }> {
  return [
    { x: M, y: M, size: MK },
    { x: W - M - MK, y: M, size: MK },
    { x: M, y: H - M - MK, size: MK },
    { x: W - M - MK, y: H - M - MK, size: MK },
  ]
}

/** Titul va grid boshlanishi (PDF bilan sinxron) */
export function omrLayoutAnchorsMm() {
  const titulTop = M + 5
  const separatorY = titulTop + 14
  const writeRowY = separatorY + 3
  const writeBoxH = 6.5
  const gridTop = writeRowY + writeBoxH + 3
  const gridLeft = M + 10
  const rollCol0CenterX = gridLeft + R
  const ansHeaderH = 6
  const qNumX = M + 62
  const ansCol0CenterX = M + 72
  const firstAnswerRowCy = gridTop + ansHeaderH + P / 2
  return {
    titulTop,
    separatorY,
    writeRowY,
    writeBoxH,
    gridTop,
    gridLeft,
    rollCol0CenterX,
    ansHeaderH,
    qNumX,
    ansCol0CenterX,
    firstAnswerRowCy,
  }
}

/** Rolik: ustun 0..4, qator raqami 0..9 (0 tepada) */
export function rollBubbleCenterMm(col: number, digitRow: number): [number, number] {
  const a = omrLayoutAnchorsMm()
  const cx = a.rollCol0CenterX + col * P
  const cy = a.gridTop + digitRow * P + P / 2
  return [cx, cy]
}

/** Javob: savol 1..20, variant 0=A .. 5=F */
export function answerBubbleCenterMm(question: number, optionIndex: number): [number, number] {
  const a = omrLayoutAnchorsMm()
  const q = Math.max(1, Math.min(20, question))
  const o = Math.max(0, Math.min(5, optionIndex))
  const cx = a.ansCol0CenterX + o * P
  const cy = a.firstAnswerRowCy + (q - 1) * P
  return [cx, cy]
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const

export type OmrOptionLetter = (typeof LETTERS)[number]

export function answerBubbleCenterByLetterMm(question: number, letter: OmrOptionLetter): [number, number] {
  const idx = LETTERS.indexOf(letter)
  return answerBubbleCenterMm(question, idx)
}

/** API / skaner uchun: barcha markazlar mm (sahifa yuqori-chap) */
export function buildOmrCoordinateMapMm() {
  const markers = omrCornerMarkersMm().map((m, i) => ({
    id: `marker_${i}`,
    /** Markaz (mm) */
    cx: m.x + m.size / 2,
    cy: m.y + m.size / 2,
    sizeMm: m.size,
  }))

  const roll: Record<string, { cx: number; cy: number; col: number; digit: number }> = {}
  for (let col = 0; col < 5; col++) {
    for (let d = 0; d < 10; d++) {
      const [cx, cy] = rollBubbleCenterMm(col, d)
      roll[`col${col}_digit${d}`] = { cx, cy, col, digit: d }
    }
  }

  const questions: Record<string, Record<OmrOptionLetter, [number, number]>> = {}
  for (let q = 1; q <= 20; q++) {
    const entry = {} as Record<OmrOptionLetter, [number, number]>
    for (let o = 0; o < 6; o++) {
      entry[LETTERS[o]] = answerBubbleCenterMm(q, o)
    }
    questions[`question_${q}`] = entry
  }

  return {
    unit: 'mm',
    page: OMR_PAGE_MM,
    marginMm: OMR_MARGIN_MM,
    bubbleDiameterMm: OMR_BUBBLE_DIAMETER_MM,
    pitchMm: OMR_PITCH_MM,
    fillThresholdSuggested: OMR_FILL_THRESHOLD_SUGGESTED,
    markers,
    roll,
    questions,
  }
}
