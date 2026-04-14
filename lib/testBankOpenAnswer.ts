/** Ochiq javob: bo'shliqlarni soddalashtirish, kichik harf */
export function normalizeOpenAnswer(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/,/g, '.')
    .toLowerCase()
}

/**
 * `correctAnswer` may contain alternatives separated by `|`.
 * Example: "42|42.0|qirq ikki"
 */
export function checkOpenAnswer(userInput: string, correctAnswerStored: string): boolean {
  const u = normalizeOpenAnswer(userInput)
  if (!u) return false
  const alternatives = correctAnswerStored
    .split('|')
    .map((x) => normalizeOpenAnswer(x))
    .filter(Boolean)
  return alternatives.some((a) => a === u)
}
