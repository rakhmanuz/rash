import { PremiumHero } from '@/components/landing/PremiumHero'

export const dynamic = 'force-dynamic'

export default async function Home() {
  return (
    <div className="w-full overflow-visible">
      <PremiumHero />
    </div>
  )
}
