'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { OnlinePageHeader } from '@/components/student-online/online-ui'

export function OnlinePaymentsPage() {
  return (
    <DashboardLayout role="STUDENT">
      <div className="online-shell online-page-bg mx-auto max-w-6xl space-y-4 pb-8 pt-1">
        <OnlinePageHeader
          title="To'lovlar"
          subtitle="Yangi online to'lov moduli noldan qurilmoqda"
        />

        <section className="online-card p-5 sm:p-6">
          <p className="text-sm text-gray-600 leading-6">
            Online to&apos;lov funksiyalari vaqtincha o&apos;chirildi. Bu sahifa yangi UX va yangi
            business-logic bilan qayta yaratiladi.
          </p>
        </section>
      </div>
    </DashboardLayout>
  )
}
