import { prisma } from '@/lib/prisma'

const SINGLETON_ID = 'singleton'

export async function getVazifaExamSettings() {
  return prisma.vazifaExamSettings.upsert({
    where: { id: SINGLETON_ID },
    create: {
      id: SINGLETON_ID,
      lockdownOpen: false,
      title: 'Vazifa topshirish',
      instructions: '',
      durationMinutes: 45,
    },
    update: {},
  })
}
