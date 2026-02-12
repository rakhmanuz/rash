import { redirect } from 'next/navigation'
import { PremiumHero } from '@/components/landing/PremiumHero'

export const dynamic = 'force-dynamic'

export default async function Home() {
  // rash-payment (port 3001): faqat to'lov login
  if (process.env.RASH_MODE === 'payment') {
    redirect('/rash')
  }
  return (
    <div className="w-full overflow-visible">
      <PremiumHero />
    </div>
  )
}
