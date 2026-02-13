import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// SQLite: WAL rejimi – concurrent yozuv/reed tezlashadi, minus yo'q
const url = process.env.DATABASE_URL ?? ''
if (url.includes('sqlite') || url.includes('.db')) {
  prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL').catch(() => {})
}
