import OpenAI from 'openai'

type AiScoreInputItem = {
  imageUrl: string
  answer: string
  approach: string
}

type AiScoreResult = {
  score: number
  feedback: string
  solutionMethod?: string
}

let cachedClient: OpenAI | null = null

function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  if (!cachedClient) cachedClient = new OpenAI({ apiKey: key })
  return cachedClient
}

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(40, Math.round(n)))
}

function tryParseJsonObject(raw: string): { score?: number; feedback?: string; solutionMethod?: string } | null {
  const text = (raw || '').trim()
  if (!text) return null
  try {
    return JSON.parse(text) as { score?: number; feedback?: string; solutionMethod?: string }
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as {
          score?: number
          feedback?: string
          solutionMethod?: string
        }
      } catch {
        return null
      }
    }
    return null
  }
}

function normalizeImageUrl(raw: string): string {
  if (!raw) return ''
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  const base =
    process.env.PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ''
  if (!base) return raw
  return `${base.replace(/\/$/, '')}/${raw.replace(/^\//, '')}`
}

export async function scoreBankSubmissionWithAI(
  items: AiScoreInputItem[]
): Promise<AiScoreResult | null> {
  const client = getClient()
  if (!client || items.length === 0) return null

  const compact = items.slice(0, 30).map((x, i) => ({
    no: i + 1,
    imageUrl: normalizeImageUrl(x.imageUrl),
    answer: x.answer.trim(),
    approach: x.approach.trim(),
  }))

  const rubric =
    "Qattiq olimpiada tekshiruvi: izoh (yechim usuli) uchun 0..40% oralig'ida baho beriladi; javob noto'g'ri bo'lsa ham izohni tahlil qilib konstruktiv fikr bering."
  const prompt = [
    'Siz matematik olimpiada hakamisiz.',
    'Talabaning rasmli savollar bo‘yicha izohlarini baholang.',
    rubric,
    'Javobni faqat JSON formatida qaytaring: {"score": number, "feedback": string, "solutionMethod": string}.',
    "score 0..40 oralig'ida bo'lsin (bu faqat izoh/usul bahosi).",
    "Baholash mezoni: avval savolning o'zi ishlanishi mantiqan to'g'ri ekanini tekshir, keyin izoh usulini bahola.",
    "Izoh sodda bo'lsa ham, amalda inson uchun qiyin yoki noqulay bo'lsa juda past baho ber.",
    "Izoh sodda, aniq, to'liq, to'g'ri va inson uchun eng qulay usulga yaqin bo'lsa maksimalga yaqin baho ber.",
    "Iloji boricha o'quvchi o'zi ishlagan fikrlash jarayonini bahola; keraksiz murakkab yoki 'copy'ga o'xshash izohni pasaytir.",
    "Agar javob xato bo'lsa, feedbackda aynan qaysi nuqta xato ekanini ayt; lekin izohdagi mantiqiy fikr va to'g'ri yo'nalish bo'lsa buni ham alohida qayd et.",
    "Feedbackda 'agar shu fikrni davom ettirsangiz, ... bo'ladi' ko'rinishidagi yo'naltiruvchi tavsiya ham bering.",
    "solutionMethod maydonida shu turdagi misolni inson uchun qulay, sodda va to'g'ri qisqa usulda yoz.",
    "Matematik formula, kasr, daraja, ildiz, tenglama va belgilarni DOIM LaTeX bilan yozing.",
    "Oddiy matn ko‘rinishidagi formula yozmang; inline uchun \\(...\\), alohida qator uchun \\[...\\] formatidan foydalaning.",
    "Masalan: \\(10 = 2 \\cdot 5\\), \\(4^a = (2^2)^a = 2^{2a}\\), \\(\\min(2a,b)\\).",
    "feedback va solutionMethod o'zbekcha bo'lsin.",
    JSON.stringify({ submissions: compact }),
  ].join('\n')

  const preferred = process.env.OPENAI_SCORING_MODEL?.trim() || 'gpt-4.1-mini'
  const fallbackModels = [preferred, 'gpt-4.1', 'gpt-4.1-mini']

  for (const model of fallbackModels) {
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Siz faqat valid JSON qaytarasiz va matematik ifodalarni faqat LaTeX ko‘rinishida yozasiz.',
          },
          { role: 'user', content: prompt },
        ],
      })
      const raw = completion.choices?.[0]?.message?.content || ''
      const parsed = tryParseJsonObject(raw)
      if (!parsed) continue
      if (typeof parsed.score !== 'number') continue
      return {
        score: clampScore(parsed.score),
        feedback:
          typeof parsed.feedback === 'string' && parsed.feedback.trim()
            ? parsed.feedback.trim().slice(0, 1000)
            : 'AI tahlil yakunlandi.',
        solutionMethod:
          typeof parsed.solutionMethod === 'string' && parsed.solutionMethod.trim()
            ? parsed.solutionMethod.trim().slice(0, 1200)
            : undefined,
      }
    } catch (e) {
      console.error(`scoreBankSubmissionWithAI model failed: ${model}`, e)
    }
  }
  return null
}
