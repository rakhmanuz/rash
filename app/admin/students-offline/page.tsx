import { redirect } from 'next/navigation'

/** Eski havola — bitta O'quvchilar sahifasiga */
export default function AdminOfflineStudentsEntry() {
  redirect('/admin/students?mode=offline')
}
