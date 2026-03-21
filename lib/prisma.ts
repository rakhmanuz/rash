import { PrismaClient } from '@prisma/client'

/** `$transaction(async (tx) => …)` ichidagi `tx`. `import { Prisma }` ba’zi server buildlarida yo‘q bo‘lishi mumkin. */
export type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// SQLite: WAL rejimi – concurrent yozuv/read tezlashadi
const url = process.env.DATABASE_URL ?? ''
if (url.includes('sqlite') || url.includes('.db')) {
  prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL').catch(() => {})
}
