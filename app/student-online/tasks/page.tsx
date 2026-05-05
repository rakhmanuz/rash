import { SectionPlaceholder } from '@/components/student-mode/SectionPlaceholder'

export default function StudentOnlineTasksPage() {
  return (
    <SectionPlaceholder
      title="Online topshiriq"
      description="Topshiriqlar online oqim uchun alohida modulga ajratildi."
      fallbackHref="/student/vazifa-topshirirish"
      fallbackLabel="Amaldagi topshiriq bo'limiga o'tish"
    />
  )
}

