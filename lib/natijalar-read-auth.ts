/** Admin «Natijalar» taxtasi va bog‘liq API-larni o‘qish (tahrirsiz) */
export function canReadNatijalarData(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'MANAGER' || role === 'RAHBAR'
}

/** Infinitylar: foydalanuvchilar ro‘yxati, tarix, statistikalar (o‘qish) */
export function canReadInfinityManagement(role: string | undefined): boolean {
  return canReadNatijalarData(role)
}

/** Infinity ballarni qo‘shish/ayirish (admin, menejer, rahbar) */
export function canMutateInfinityPoints(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'MANAGER' || role === 'RAHBAR'
}
