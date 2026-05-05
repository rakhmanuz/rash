import { SectionPlaceholder } from '@/components/student-mode/SectionPlaceholder'

export default function StudentOfflineLessonsPage() {
  return (
    <SectionPlaceholder
      title="Offline darslar"
      description="Offline oqim uchun darslar bo'limi alohida rootda boshqariladi."
      fallbackHref="/student/dashboard"
      fallbackLabel="Mavjud darslar sahifasiga o'tish"
    />
  )
}

