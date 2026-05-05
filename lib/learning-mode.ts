import type { Prisma } from '@prisma/client'

export type LearningMode = 'ONLINE' | 'OFFLINE'

export const DEFAULT_LEARNING_MODE: LearningMode = 'OFFLINE'

export function normalizeLearningMode(value: unknown): LearningMode {
  return value === 'ONLINE' ? 'ONLINE' : 'OFFLINE'
}

/** Reyting va statistikada faqat shu oqimdagi o‘quvchilar (online / offline alohida). */
export function prismaStudentWhereForSameLearningMode(mode: LearningMode): Prisma.StudentWhereInput {
  if (mode === 'ONLINE') {
    return { user: { learningMode: 'ONLINE' } }
  }
  return {
    user: {
      learningMode: 'OFFLINE',
    },
  }
}

export function isStudentRole(role: unknown): boolean {
  return role === 'STUDENT'
}

