export type TaskAttachment = {
  url: string
  name: string
  type: string
  size: number
  source?: 'ADMIN' | 'XODIM'
}

const START_MARKER = '[TASK_ATTACHMENTS_START]'
const END_MARKER = '[TASK_ATTACHMENTS_END]'

export function sanitizeAttachments(input: unknown): TaskAttachment[] {
  if (!Array.isArray(input)) return []
  return input
    .map((item) => {
      const row = item as Partial<TaskAttachment>
      const url = String(row.url || '').trim()
      const name = String(row.name || '').trim()
      const type = String(row.type || '').trim()
      const size = Number(row.size || 0)
      if (!url || !name) return null
      return {
        url,
        name,
        type: type || 'application/octet-stream',
        size: Number.isFinite(size) && size > 0 ? size : 0,
        source: row.source === 'XODIM' ? 'XODIM' : row.source === 'ADMIN' ? 'ADMIN' : undefined,
      }
    })
    .filter(Boolean) as TaskAttachment[]
}

export function parseTaskDescription(raw: string | null | undefined): {
  description: string
  attachments: TaskAttachment[]
} {
  const text = String(raw || '')
  const start = text.indexOf(START_MARKER)
  const end = text.indexOf(END_MARKER)
  if (start === -1 || end === -1 || end <= start) {
    return { description: text.trim(), attachments: [] }
  }

  const jsonRaw = text.slice(start + START_MARKER.length, end).trim()
  let attachments: TaskAttachment[] = []
  try {
    attachments = sanitizeAttachments(JSON.parse(jsonRaw))
  } catch {
    attachments = []
  }

  const before = text.slice(0, start).trim()
  const after = text.slice(end + END_MARKER.length).trim()
  const description = [before, after].filter(Boolean).join('\n\n').trim()

  return { description, attachments }
}

export function buildTaskDescription(
  description: string | null | undefined,
  attachments: TaskAttachment[]
): string {
  const cleanDescription = String(description || '').trim()
  const cleanAttachments = sanitizeAttachments(attachments)

  if (cleanAttachments.length === 0) {
    return cleanDescription
  }

  const attachmentsBlock = `${START_MARKER}\n${JSON.stringify(cleanAttachments)}\n${END_MARKER}`
  return [attachmentsBlock, cleanDescription].filter(Boolean).join('\n\n')
}
