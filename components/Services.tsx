import { Palette, ShoppingCart, Briefcase, Users, BarChart, Settings } from 'lucide-react'

const services = [
  {
    icon: Palette,
    title: 'Veb Dizayn',
    description: 'Zamonaviy va jozibador veb-dizayn yechimlari',
  },
  {
    icon: ShoppingCart,
    title: 'E-commerce',
    description: 'To\'liq funksional onlayn do\'kon platformalari',
  },
  {
    icon: Briefcase,
    title: 'Biznes Yechimlari',
    description: 'Korporativ saytlar va biznes platformalari',
  },
  {
    icon: Users,
    title: 'Ijtimoiy Tarmoqlar',
    description: 'Ijtimoiy tarmoq va hamjamiyat platformalari',
  },
  {
    icon: BarChart,
    title: 'Analitika',
    description: 'Kuchli analitika va hisobot tizimlari',
  },
  {
    icon: Settings,
    title: 'Maxsus Yechimlar',
    description: 'Sizning ehtiyojlaringizga moslashtirilgan yechimlar',
  },
]

export function Services() {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Bizning Xizmatlar
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Keng qamrovli veb-sayt yechimlari
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg mb-4">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {service.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
