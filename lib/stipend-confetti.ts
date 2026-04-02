/**
 * Stipendiya sahifasi — grant / yutuq muhitiga o‘xshash konfetti.
 * z-index yuqori (layout/modallar ustida); reduced-motion konfetti ichida majburan yoqiladi.
 */
import confetti, { type Options } from 'canvas-confetti'

/** Brauzer stacking / sidebar (z-40…60) va overlay ustida chiqishi uchun */
const Z_OVERLAY = 2147483000

const celebrationColors = [
  '#fbbf24',
  '#fcd34d',
  '#34d399',
  '#6ee7b7',
  '#a78bfa',
  '#c4b5fd',
  '#38bdf8',
  '#f472b6',
  '#fb923c',
  '#fef08a',
]

export function fireStipendCelebrationConfetti(): void {
  if (typeof window === 'undefined') return

  const burst = (opts: Options) =>
    confetti({
      ...opts,
      zIndex: Z_OVERLAY,
      /** Tizimda «animatsiyani kamaytirish» bo‘lsa ham konfetti chiqishi uchun */
      disableForReducedMotion: false,
      colors: celebrationColors,
    })

  try {
    burst({
      particleCount: 100,
      spread: 76,
      startVelocity: 52,
      origin: { x: 0.06, y: 0.76 },
      angle: 58,
      scalar: 1.05,
    })
    burst({
      particleCount: 100,
      spread: 76,
      startVelocity: 52,
      origin: { x: 0.94, y: 0.76 },
      angle: 122,
      scalar: 1.05,
    })

    window.setTimeout(() => {
      burst({
        particleCount: 85,
        spread: 360,
        startVelocity: 32,
        origin: { x: 0.5, y: 0.32 },
        ticks: 240,
        gravity: 0.82,
      })
    }, 320)

    const end = Date.now() + 3100
    const stream = () => {
      burst({
        particleCount: 3,
        angle: 64,
        spread: 54,
        origin: { x: 0, y: 0.68 },
        startVelocity: 42,
        ticks: 140,
      })
      burst({
        particleCount: 3,
        angle: 116,
        spread: 54,
        origin: { x: 1, y: 0.68 },
        startVelocity: 42,
        ticks: 140,
      })
      if (Date.now() < end) requestAnimationFrame(stream)
    }
    requestAnimationFrame(stream)

    window.setTimeout(() => {
      burst({
        particleCount: 55,
        spread: 68,
        origin: { x: 0.18, y: 0.78 },
        angle: 62,
      })
      burst({
        particleCount: 55,
        spread: 68,
        origin: { x: 0.82, y: 0.78 },
        angle: 118,
      })
    }, 750)

    window.setTimeout(() => {
      burst({
        particleCount: 40,
        spread: 70,
        origin: { x: 0.5, y: 0.85 },
        startVelocity: 22,
        angle: 90,
      })
    }, 1400)
  } catch (e) {
    console.error('[stipend-confetti]', e)
  }
}
