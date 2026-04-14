/** Clipboard yoki drag-drop dan birinchi rasm faylini oladi */
export function imageFileFromDataTransfer(dt: DataTransfer | null): File | null {
  if (!dt) return null
  const items = dt.items ? Array.from(dt.items) : []
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const f = item.getAsFile()
      if (f) return ensureNamedImageFile(f)
    }
  }
  const files = dt.files ? Array.from(dt.files) : []
  for (const f of files) {
    if (f.type.startsWith('image/')) return ensureNamedImageFile(f)
  }
  return null
}

/** Ba’zi brauzerlar `image.png` nomi bilan beradi — server/yuklash uchun aniq nom */
export function ensureNamedImageFile(f: File): File {
  const extFromType =
    f.type === 'image/jpeg'
      ? 'jpg'
      : f.type === 'image/webp'
        ? 'webp'
        : f.type === 'image/gif'
          ? 'gif'
          : 'png'
  const hasReasonableName = f.name && !/^image\.(png|jpe?g|gif|webp)$/i.test(f.name)
  if (hasReasonableName) return f
  const mime =
    extFromType === 'jpg'
      ? 'image/jpeg'
      : extFromType === 'webp'
        ? 'image/webp'
        : extFromType === 'gif'
          ? 'image/gif'
          : 'image/png'
  return new File([f], `rasm-${Date.now()}.${extFromType}`, { type: f.type || mime })
}
