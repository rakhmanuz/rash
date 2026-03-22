/** O'quvchi contacts JSON → 3 ta { label, phone } */

export function parseStudentContacts(
  contacts: string | null,
  userPhone: string | null
): { label: string; phone: string }[] {
  const legacy = ["o'zi", 'onasi', "bobosi"] as const
  try {
    const arr = contacts ? JSON.parse(contacts) : []
    if (Array.isArray(arr) && arr.length === 3 && arr.every((x: unknown) => x && typeof x === 'object')) {
      return arr.map((x: { label?: string; phone?: string }, i: number) => ({
        label: String(x.label || legacy[i]),
        phone: String(x.phone ?? '').trim() || (i === 0 && userPhone ? userPhone : ''),
      }))
    }
    if (Array.isArray(arr) && arr.length > 0) {
      return legacy.map((label) => {
        const found = arr.find((item: { label?: string }) => item?.label === label)
        return { label, phone: String(found?.phone ?? '').trim() }
      })
    }
  } catch {
    /* ignore */
  }
  return legacy.map((label, i) => ({
    label,
    phone: i === 0 && userPhone ? userPhone : '',
  }))
}
