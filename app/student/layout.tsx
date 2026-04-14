import { StudentShellProvider } from '@/components/student-shell-context'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentShellProvider>{children}</StudentShellProvider>
}
