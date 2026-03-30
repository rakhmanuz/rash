/** Stipendiya dasturlari — oflayn imtihonlar orqali g‘oliblar admin tomonidan kiritiladi */

export const STIPEND_PROGRAM_CODES = [
  'SULTONOV',
  'EXCELLENT',
  'RASH_UZ',
  'IQMAX',
] as const

export type StipendProgramCode = (typeof STIPEND_PROGRAM_CODES)[number]

export type StipendProgramMeta = {
  code: StipendProgramCode
  title: string
  subtitle: string
  accent: 'amber' | 'violet' | 'sky' | 'emerald'
}

export const STIPEND_PROGRAMS: StipendProgramMeta[] = [
  {
    code: 'SULTONOV',
    title: 'SULTONOV stipendiyasi',
    subtitle: 'Sultonov dasturi doirasidagi oflayn imtihon natijalari.',
    accent: 'amber',
  },
  {
    code: 'EXCELLENT',
    title: 'EXCELLENT stipendiyasi',
    subtitle: 'Excellent tanlovi / imtihonlari bo‘yicha muvaffaqiyat.',
    accent: 'violet',
  },
  {
    code: 'RASH_UZ',
    title: 'rash.uz stipendiyasi',
    subtitle: 'rash.uz platformasi va markaziy oflayn imtihonlar.',
    accent: 'sky',
  },
  {
    code: 'IQMAX',
    title: 'IQMax stipendiyasi',
    subtitle: 'IQMax akademiyasi oflayn imtihonlari va tanlov natijalari.',
    accent: 'emerald',
  },
]

const CODE_SET = new Set<string>(STIPEND_PROGRAM_CODES)

export function isStipendProgramCode(v: string): v is StipendProgramCode {
  return CODE_SET.has(v)
}

export function stipendMeta(
  code: string
): StipendProgramMeta | undefined {
  return STIPEND_PROGRAMS.find((p) => p.code === code)
}
