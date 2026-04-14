import { prisma } from '@/lib/prisma'

/** Birinchi ochilganda 6 ta qism (1–6) yaratiladi */
export async function ensureSixTestBankParts() {
  for (let sortOrder = 1; sortOrder <= 6; sortOrder++) {
    const ex = await prisma.testBankPart.findUnique({ where: { sortOrder } })
    if (!ex) {
      await prisma.testBankPart.create({
        data: { sortOrder, title: `${sortOrder}-qism` },
      })
    }
  }
}
