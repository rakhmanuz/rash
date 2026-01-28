import { Zap, Shield, Rocket, Globe, Code, Heart } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Tez va Optimallashtirilgan',
    description: 'Eng zamonaviy texnologiyalar bilan qurilgan, tez yuklanadigan va samarali ishlaydigan sayt.',
  },
  {
    icon: Shield,
    title: 'Xavfsiz va Ishonchli',
    description: 'Yuqori darajadagi xavfsizlik standartlari va muntazam yangilanishlar bilan himoyalangan.',
  },
  {
    icon: Rocket,
    title: 'Kengaytiriladigan',
    description: 'Biznesingiz o\'sishi bilan birga o\'sadigan, moslashuvchan arxitektura.',
  },
  {
    icon: Globe,
    title: 'Global Qo\'llab-quvvatlash',
    description: 'Dunyoning istalgan joyidan foydalanish mumkin bo\'lgan, ko\'p tilli platforma.',
  },
  {
    icon: Code,
    title: 'Zamonaviy Texnologiyalar',
    description: 'Next.js, TypeScript, Prisma va boshqa eng so\'nggi texnologiyalar bilan qurilgan.',
  },
  {
    icon: Heart,
    title: 'Foydalanuvchi Do\'stona',
    description: 'Intuitiv interfeys va ajoyib foydalanuvchi tajribasi.',
  },
]

export function Features() {
  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Nega bizni tanlash kerak?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Bizning platforma sizga eng yaxshi yechimlarni taqdim etadi
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-lg transition-shadow duration-300"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
