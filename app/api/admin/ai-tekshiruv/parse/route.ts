import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import mammoth from 'mammoth'
import OpenAI from 'openai'
import JSZip from 'jszip'

type ParsedQuestion = {
  questionText: string
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  status?: 'good' | 'needs_fix'
  reason?: string
  improvedText?: string
  latexText?: string
}

type EnrichedQuestion = {
  index: number
  text: string
  options: { A?: string; B?: string; C?: string; D?: string }
  source: 'text' | 'image'
  ai: {
    status: 'good' | 'needs_fix'
    reason: string
    improvedText: string
    latexText: string
  }
}

function normalizeSpaces(s: string) {
  return (s || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeLatexForDisplay(input: string) {
  let s = normalizeSpaces(input)
  // Avoid noisy latex wrappers for natural language text.
  s = s.replace(/\\text\{([^}]*)\}/g, '$1')
  s = s.replace(/\\times/g, '×')
  s = s.replace(/\\cdot/g, '·')
  return s
}

function splitIntoQuestionsFallback(raw: string): ParsedQuestion[] {
  const text = (raw || '').replace(/\r\n/g, '\n').trim()
  if (!text) return []

  const marker = /^\s*(\d{1,3})\s*[\)\.\-]\s+/gm
  const indices: Array<{ at: number }> = []

  let match: RegExpExecArray | null
  while ((match = marker.exec(text)) !== null) {
    indices.push({ at: match.index })
  }

  if (indices.length === 0) return [{ questionText: normalizeSpaces(text) }]

  const blocks: ParsedQuestion[] = []
  for (let i = 0; i < indices.length; i++) {
    const start = indices[i].at
    const end = i + 1 < indices.length ? indices[i + 1].at : text.length
    const chunk = text.slice(start, end).trim()
    if (chunk) blocks.push({ questionText: normalizeSpaces(chunk) })
  }

  return blocks
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY topilmadi')
  }

  return new OpenAI({ apiKey })
}

async function extractQuestionsWithOpenAIFromText(rawText: string): Promise<ParsedQuestion[]> {
  const client = getOpenAIClient()
  const input = normalizeSpaces(rawText).slice(0, 80000)
  if (!input) return []

  const prompt = [
    'Siz matematika testlari uchun professional parser va muharrirsiz.',
    'Matndan savollarni ajrating va noaniq joylarni mantiqan to‘ldirib, toza variant qaytaring.',
    'Savol mazmunini saqlang, lekin buzilgan OCR matnini to‘g‘rilang.',
    'Savolni yechmang, faqat matnni tiklang va formatlang.',
    'Agar variantlar bo‘lsa A/B/C/D maydonlariga ajrating.',
    'Formulalarda faqat zarur bo‘lsa oddiy LaTeX ishlating; gaplarni \\text{} bilan o‘ramang.',
    'Noto‘g‘ri joylarni improvedText ichida to‘g‘rilang, reason qisqa bo‘lsin.',
    'FAqat JSON qaytaring:',
    '{ "questions": [',
    '  {',
    '    "questionText": "string",',
    '    "optionA": "string?", "optionB": "string?", "optionC": "string?", "optionD": "string?",',
    '    "status": "good|needs_fix",',
    '    "reason": "string",',
    '    "improvedText": "string",',
    '    "latexText": "string"',
    '  }',
    '] }',
    '',
    'MATN:',
    input,
  ].join('\n')

  const completion = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'Siz faqat valid JSON qaytarasiz.' },
      { role: 'user', content: prompt },
    ],
  })

  const content = completion.choices?.[0]?.message?.content || '{}'
  const parsed = JSON.parse(content) as { questions?: ParsedQuestion[] }
  return Array.isArray(parsed.questions) ? parsed.questions : []
}

async function extractDocxImages(buffer: Buffer): Promise<Array<{ mime: string; base64: string }>> {
  const zip = await JSZip.loadAsync(buffer)
  const imageEntries = Object.values(zip.files).filter((f) =>
    /^word\/media\/.+\.(png|jpg|jpeg|webp)$/i.test(f.name)
  )
  const maxImages = 6
  const selected = imageEntries.slice(0, maxImages)

  const out: Array<{ mime: string; base64: string }> = []
  for (const entry of selected) {
    const bytes = await entry.async('nodebuffer')
    const lower = entry.name.toLowerCase()
    const mime = lower.endsWith('.png')
      ? 'image/png'
      : lower.endsWith('.webp')
      ? 'image/webp'
      : 'image/jpeg'
    out.push({ mime, base64: bytes.toString('base64') })
  }
  return out
}

async function extractQuestionsWithOpenAIFromImage(dataUrl: string): Promise<ParsedQuestion[]> {
  const client = getOpenAIClient()

  const completion = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'Siz rasm ichidagi testlarni aniq ajratib berasiz va faqat JSON qaytarasiz.' },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              'Rasmda ko‘rinayotgan matematika test savollarini o‘qib, toza va to‘liq ko‘rinishda qayta yozing. OCR xatolarini mantiqan to‘g‘rilang, ammo savol ma\'nosini o‘zgartirmang. Savolni yechmang. Variantlarni A/B/C/D ga aniq ajrating. JSON format: { "questions": [{ "questionText":"", "optionA":"", "optionB":"", "optionC":"", "optionD":"", "status":"good|needs_fix", "reason":"", "improvedText":"", "latexText":"" }] }. latexTextda gaplarni \\text{} bilan o‘ramang.',
          },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
  })

  const content = completion.choices?.[0]?.message?.content || '{}'
  const parsed = JSON.parse(content) as { questions?: ParsedQuestion[] }
  return Array.isArray(parsed.questions) ? parsed.questions : []
}

function toEnriched(items: ParsedQuestion[], source: 'text' | 'image'): EnrichedQuestion[] {
  return items
    .map((q) => {
      const questionText = normalizeSpaces(q.questionText || '')
      if (!questionText) return null
      const status: 'good' | 'needs_fix' = q.status === 'good' ? 'good' : 'needs_fix'
      return {
        index: 0,
        text: questionText,
        options: {
          A: normalizeSpaces(q.optionA || ''),
          B: normalizeSpaces(q.optionB || ''),
          C: normalizeSpaces(q.optionC || ''),
          D: normalizeSpaces(q.optionD || ''),
        },
        source,
        ai: {
          status,
          reason: normalizeSpaces(q.reason || (status === 'good' ? 'Savol yaxshi holatda.' : 'Tekshiruv tavsiya etildi.')),
          improvedText: normalizeSpaces(q.improvedText || questionText),
          // For image-origin OCR, prefer readable plain text over aggressive latex conversion.
          latexText:
            source === 'image'
              ? normalizeLatexForDisplay(q.improvedText || questionText)
              : normalizeLatexForDisplay(q.latexText || q.improvedText || questionText),
        },
      }
    })
    .filter(Boolean) as EnrichedQuestion[]
}

function dedupeQuestions(items: EnrichedQuestion[]): EnrichedQuestion[] {
  const seen = new Set<string>()
  const out: EnrichedQuestion[] = []
  for (const item of items) {
    const key = item.text.toLowerCase().replace(/\s+/g, ' ').trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out.map((q, i) => ({ ...q, index: i + 1 }))
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const form = await req.formData()
    const file = form.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Fayl topilmadi' }, { status: 400 })
    }

    const name = (file as File).name || 'upload'
    const lower = name.toLowerCase()

    // DOCX is supported via mammoth. .doc (binary) needs a different extractor; keep it explicit for now.
    if (!lower.endsWith('.docx')) {
      return NextResponse.json(
        { error: 'Hozircha faqat .docx qo‘llab-quvvatlanadi' },
        { status: 400 }
      )
    }

    const arrayBuffer = await (file as File).arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const { value } = await mammoth.extractRawText({ buffer })
    const rawText = normalizeSpaces(value || '')

    const imageCandidates = await extractDocxImages(buffer)

    let textParsed: ParsedQuestion[] = []
    if (rawText) {
      textParsed = await extractQuestionsWithOpenAIFromText(rawText)
      if (textParsed.length === 0) {
        textParsed = splitIntoQuestionsFallback(rawText)
      }
    }

    let imageParsed: ParsedQuestion[] = []
    for (const img of imageCandidates) {
      try {
        const dataUrl = `data:${img.mime};base64,${img.base64}`
        const parsed = await extractQuestionsWithOpenAIFromImage(dataUrl)
        if (parsed.length > 0) imageParsed = imageParsed.concat(parsed)
      } catch (e) {
        console.error('Image parse chunk failed:', e)
      }
    }

    const merged = dedupeQuestions([
      ...toEnriched(imageParsed, 'image'),
      ...toEnriched(textParsed, 'text'),
    ])

    if (merged.length === 0) {
      return NextResponse.json({ error: 'Savollar ajratib olinmadi. Fayl sifati past bo‘lishi mumkin.' }, { status: 400 })
    }

    return NextResponse.json({
      fileName: name,
      rawTextLength: rawText.length,
      imageCount: imageCandidates.length,
      count: merged.length,
      questions: merged,
    })
  } catch (error) {
    console.error('AI tekshiruv parse error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

