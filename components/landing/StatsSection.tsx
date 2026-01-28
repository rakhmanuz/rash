import { Users, BookOpen, TrendingUp, Award } from 'lucide-react'

const stats = [
  {
    icon: Users,
    value: '10,000+',
    label: 'O\'quvchilar',
    color: 'text-blue-400',
  },
  {
    icon: BookOpen,
    value: '500+',
    label: 'Guruhlar',
    color: 'text-green-400',
  },
  {
    icon: TrendingUp,
    value: '95%',
    label: 'Muvaffaqiyat darajasi',
    color: 'text-purple-400',
  },
  {
    icon: Award,
    value: '100+',
    label: 'O\'qituvchilar',
    color: 'text-yellow-400',
  },
]

export function StatsSection() {
  return (
    <section className="py-24 bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 border border-gray-700 rounded-full mb-4">
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-lg text-gray-400">
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
