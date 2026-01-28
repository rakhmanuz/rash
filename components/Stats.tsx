import { Users, Code, Award, Clock } from 'lucide-react'

const stats = [
  {
    icon: Users,
    value: '10K+',
    label: 'Mamnun Foydalanuvchilar',
    color: 'text-blue-600',
  },
  {
    icon: Code,
    value: '500+',
    label: 'Loyihalar',
    color: 'text-green-600',
  },
  {
    icon: Award,
    value: '50+',
    label: 'Mukofotlar',
    color: 'text-yellow-600',
  },
  {
    icon: Clock,
    value: '24/7',
    label: 'Qo\'llab-quvvatlash',
    color: 'text-purple-600',
  },
]

export function Stats() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="text-center text-white"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                  <Icon className={`h-8 w-8 ${stat.color.replace('text-', 'text-white')}`} />
                </div>
                <div className="text-4xl sm:text-5xl font-bold mb-2">
                  {stat.value}
                </div>
                <div className="text-lg text-primary-100">
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
