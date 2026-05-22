import { redirect } from 'next/navigation'

/** Eski havola — bitta O'quvchilar sahifasiga */
export default function AdminOnlineStudentsEntry() {
  redirect('/admin/students?mode=online')
}
