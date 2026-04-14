/** API dan kelgan `enrollments` yoki `currentGroupName` dan bitta qator matn (stipendiya, ro'yxatlar). */
export function formatEnrollmentsListForStudent(student: {
  enrollments?: Array<{ groupName: string; subjectName?: string | null }> | null
  currentGroupName?: string | null
}): string {
  const list = student.enrollments
  if (list && list.length > 0) {
    return list
      .map((e) => {
        const gn = (e.groupName || '').trim()
        const sn = (e.subjectName || '').trim()
        return sn ? `${sn}: ${gn}` : gn
      })
      .filter(Boolean)
      .join('; ')
  }
  return (student.currentGroupName || '').trim()
}

/** Guruh kartochkasi / select — fan bo'lsa oldiga qo'shiladi */
export function formatGroupLabel(group: {
  name: string
  subject?: { name?: string | null } | null
}): string {
  const sn = group.subject?.name?.trim()
  return sn ? `${sn}: ${group.name}` : group.name
}
