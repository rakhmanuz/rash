import sharp from 'sharp'
import {
  OMR_PAGE_MM,
  OMR_BUBBLE_DIAMETER_MM,
  OMR_FILL_THRESHOLD_SUGGESTED,
  answerBubbleCenterMm,
  omrCornerMarkersMm,
  rollBubbleCenterMm,
} from '@/lib/omrLayoutSpec'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const
const Wmm = OMR_PAGE_MM.w
const Hmm = OMR_PAGE_MM.h

type Homography = {
  h00: number
  h01: number
  h02: number
  h10: number
  h11: number
  h12: number
  h20: number
  h21: number
  h22: number
}

function solve8x8(A: number[][], b: number[]): number[] | null {
  const n = 8
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let piv = col
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r
    }
    if (Math.abs(M[piv][col]) < 1e-9) return null
    ;[M[col], M[piv]] = [M[piv], M[col]]
    const div = M[col][col]
    for (let c = col; c <= n; c++) M[col][c] /= div
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = M[r][col]
      if (f === 0) continue
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c]
    }
  }
  return M.map((row) => row[n])
}

/** 4 nuqta: mm (varaq) → piksel (rasm) */
function homographyFrom4Pairs(srcMm: [number, number][], dstPx: [number, number][]): Homography | null {
  const A: number[][] = []
  const B: number[] = []
  for (let i = 0; i < 4; i++) {
    const [x, y] = srcMm[i]
    const [u, v] = dstPx[i]
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y])
    B.push(u)
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y])
    B.push(v)
  }
  const h = solve8x8(A, B)
  if (!h) return null
  return {
    h00: h[0],
    h01: h[1],
    h02: h[2],
    h10: h[3],
    h11: h[4],
    h12: h[5],
    h20: h[6],
    h21: h[7],
    h22: 1,
  }
}

function project(H: Homography, x: number, y: number): [number, number] {
  const X = H.h00 * x + H.h01 * y + H.h02
  const Y = H.h10 * x + H.h11 * y + H.h12
  const Wc = H.h20 * x + H.h21 * y + H.h22
  if (Math.abs(Wc) < 1e-9) return [NaN, NaN]
  return [X / Wc, Y / Wc]
}

function findDarkBoundingBox(pixels: Uint8Array, w: number, h: number) {
  let minX = w
  let maxX = 0
  let minY = h
  let maxY = 0
  const paper = 248
  for (let y = 0; y < h; y++) {
    const row = y * w
    for (let x = 0; x < w; x++) {
      if (pixels[row + x] < paper) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (minX >= maxX || minY >= maxY) return null
  const padX = Math.max(2, Math.round((maxX - minX) * 0.01))
  const padY = Math.max(2, Math.round((maxY - minY) * 0.01))
  minX = Math.max(0, minX - padX)
  maxX = Math.min(w - 1, maxX + padX)
  minY = Math.max(0, minY - padY)
  maxY = Math.min(h - 1, maxY + padY)
  return { minX, maxX, minY, maxY, bw: maxX - minX + 1, bh: maxY - minY + 1 }
}

function meanRect(pixels: Uint8Array, w: number, h: number, x0: number, y0: number, rw: number, rh: number) {
  let s = 0
  let n = 0
  const x1 = Math.max(0, Math.floor(x0))
  const y1 = Math.max(0, Math.floor(y0))
  const x2 = Math.min(w - 1, Math.ceil(x0 + rw))
  const y2 = Math.min(h - 1, Math.ceil(y0 + rh))
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      s += pixels[y * w + x]
      n++
    }
  }
  return n > 0 ? s / n : 255
}

/** Qora marker markazini lokal qidiruv */
function refineMarkerCenter(
  pixels: Uint8Array,
  w: number,
  h: number,
  ex: number,
  ey: number,
  win: number,
  box: number
) {
  let bestM = 256
  let bx = ex
  let by = ey
  const step = Math.max(2, Math.floor(win / 25))
  for (let dy = -win; dy <= win; dy += step) {
    for (let dx = -win; dx <= win; dx += step) {
      const cx = ex + dx
      const cy = ey + dy
      if (cx < box || cy < box || cx >= w - box || cy >= h - box) continue
      const m = meanRect(pixels, w, h, cx - box / 2, cy - box / 2, box, box)
      if (m < bestM) {
        bestM = m
        bx = cx
        by = cy
      }
    }
  }
  return [bx, by] as [number, number]
}

function sampleBubbleDarkness(
  pixels: Uint8Array,
  w: number,
  h: number,
  cx: number,
  cy: number,
  rPx: number
): number {
  if (!Number.isFinite(cx) || !Number.isFinite(cy) || rPx < 1) return 0
  let sum = 0
  let cnt = 0
  const r2 = rPx * rPx
  const x0 = Math.max(0, Math.floor(cx - rPx - 1))
  const x1 = Math.min(w - 1, Math.ceil(cx + rPx + 1))
  const y0 = Math.max(0, Math.floor(cy - rPx - 1))
  const y1 = Math.min(h - 1, Math.ceil(cy + rPx + 1))
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= r2) {
        sum += pixels[y * w + x]
        cnt++
      }
    }
  }
  if (cnt === 0) return 0
  const avg = sum / cnt
  return (255 - avg) / 255
}

export type OmrQuestionResult = {
  question: number
  detected: (typeof LETTERS)[number] | null
  scores: Record<(typeof LETTERS)[number], number>
  key: (typeof LETTERS)[number]
  isCorrect: boolean
}

export type OmrScanResult = {
  ok: true
  rollRead: string
  rollAmbiguous: boolean
  answers: OmrQuestionResult[]
  correctCount: number
  totalQuestions: number
  thresholdUsed: number
}

export type OmrScanError = { ok: false; error: string }

function normalizeAnswerKey(raw: string): string | null {
  const s = raw.replace(/\s+/g, '').toUpperCase()
  if (s.length !== 20) return null
  if (!/^[A-F]{20}$/.test(s)) return null
  return s
}

export async function scanOmrImage(buffer: Buffer, answerKeyRaw: string): Promise<OmrScanResult | OmrScanError> {
  const answerKey = normalizeAnswerKey(answerKeyRaw)
  if (!answerKey) {
    return { ok: false, error: "Javob kaliti: aynan 20 ta harf (A–F), bo'sh joysiz." }
  }

  const maxW = 1400
  const { data, info } = await sharp(buffer)
    .rotate()
    .resize({ width: maxW, withoutEnlargement: true })
    .greyscale()
    .normalize()
    .blur(0.4)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const w = info.width
  const h = info.height
  const pixels = new Uint8Array(data)
  const bbox = findDarkBoundingBox(pixels, w, h)
  if (!bbox || bbox.bw < w * 0.2 || bbox.bh < h * 0.2) {
    return { ok: false, error: 'Varaq aniqlanmadi. Rasmni yaxshiroq yoritish yoki yaqinroq surating.' }
  }

  const scale = Math.min(bbox.bw / Wmm, bbox.bh / Hmm)
  const ox = bbox.minX + (bbox.bw - Wmm * scale) / 2
  const oy = bbox.minY + (bbox.bh - Hmm * scale) / 2
  const markerBoxPx = Math.max(4, Math.min(18, Math.round(3 * scale)))
  const win = Math.max(20, Math.round(0.04 * Math.min(w, h)))

  const mmCenters = omrCornerMarkersMm().map((m) => [m.x + m.size / 2, m.y + m.size / 2] as [number, number])
  const dstRough: [number, number][] = mmCenters.map(([mx, my]) => [ox + mx * scale, oy + my * scale])

  const dstRefined: [number, number][] = dstRough.map(([ex, ey]) =>
    refineMarkerCenter(pixels, w, h, ex, ey, win, markerBoxPx)
  )

  let H = homographyFrom4Pairs(mmCenters, dstRefined)
  if (!H) {
    H = {
      h00: scale,
      h01: 0,
      h02: ox,
      h10: 0,
      h11: scale,
      h12: oy,
      h20: 0,
      h21: 0,
      h22: 1,
    }
  }

  const rPx = Math.max(2.5, Math.min(12, (OMR_BUBBLE_DIAMETER_MM / 2) * scale * 0.92))
  const th = OMR_FILL_THRESHOLD_SUGGESTED
  const ambiguousGap = 0.06

  let rollDigits = ''
  let rollAmbiguous = false
  for (let col = 0; col < 5; col++) {
    let bestD = 0
    let bestS = -1
    let second = -1
    for (let d = 0; d < 10; d++) {
      const [cxmm, cymm] = rollBubbleCenterMm(col, d)
      const [px, py] = project(H, cxmm, cymm)
      const sc = sampleBubbleDarkness(pixels, w, h, px, py, rPx)
      if (sc > bestS) {
        second = bestS
        bestS = sc
        bestD = d
      } else if (sc > second) {
        second = sc
      }
    }
    if (bestS < th) {
      rollDigits += '?'
      rollAmbiguous = true
    } else if (second >= 0 && bestS - second < ambiguousGap) {
      rollDigits += '?'
      rollAmbiguous = true
    } else {
      rollDigits += String(bestD)
    }
  }

  const answers: OmrQuestionResult[] = []
  let correctCount = 0

  for (let q = 1; q <= 20; q++) {
    const key = answerKey[q - 1] as (typeof LETTERS)[number]
    const scores = {} as Record<(typeof LETTERS)[number], number>
    let bestL: (typeof LETTERS)[number] | null = null
    let bestS = -1
    let second = -1
    for (let o = 0; o < 6; o++) {
      const L = LETTERS[o]
      const [cxmm, cymm] = answerBubbleCenterMm(q, o)
      const [px, py] = project(H, cxmm, cymm)
      const sc = sampleBubbleDarkness(pixels, w, h, px, py, rPx)
      scores[L] = Math.round(sc * 1000) / 1000
      if (sc > bestS) {
        second = bestS
        bestS = sc
        bestL = L
      } else if (sc > second) {
        second = sc
      }
    }
    let detected = bestL
    if (bestS < th) detected = null
    else if (second >= 0 && bestS - second < ambiguousGap) detected = null

    const isCorrect = detected !== null && detected === key
    if (isCorrect) correctCount++
    answers.push({ question: q, detected, scores, key, isCorrect })
  }

  return {
    ok: true,
    rollRead: rollDigits,
    rollAmbiguous,
    answers,
    correctCount,
    totalQuestions: 20,
    thresholdUsed: th,
  }
}
