import { SectionPlaceholder } from '@/components/student-mode/SectionPlaceholder'

export default function StudentOfflineTasksPage() {
  return (
    <SectionPlaceholder
      title="Offline topshiriq"
      description="Topshiriqlar offline oqim uchun alohida modulga ajratildi."
      fallbackHref="/student/vazifa-topshirirish"
      fallbackLabel="Amaldagi topshiriq bo'limiga o'tish"
    />
  )
}

