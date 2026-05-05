import type { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeLearningMode, type LearningMode } from '@/lib/learning-mode'

export async function getUserRoleAndMode(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, learningMode: true },
  })
  if (!user) return null
  return {
    role: user.role,
    learningMode: normalizeLearningMode(user.learningMode),
  }
}

export function modeFromPath(pathname: string): LearningMode | null {
  if (pathname.startsWith('/student-online')) return 'ONLINE'
  if (pathname.startsWith('/student-offline')) return 'OFFLINE'
  return null
}

export function isModeAllowed(requested: LearningMode | null, actual: LearningMode): boolean {
  if (!requested) return true
  return requested === actual
}

