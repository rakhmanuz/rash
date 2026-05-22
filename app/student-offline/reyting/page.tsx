import { redirect } from 'next/navigation'

/** Offline o'quvchilarda reyting bo'limi yo'q */
export default function StudentOfflineReytingPage() {
  redirect('/student-offline/dashboard')
}
