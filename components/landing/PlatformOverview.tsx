import { Brain, Users, TrendingUp, Shield, Zap, BarChart3 } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'Aqlli Boshqaruv',
    description: 'Barcha jarayonlar avtomatik. Qo\'lda hisob-kitoblar yo\'q.',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Users,
    title: 'To\'liq Nazorat',
    description: 'O\'quvchilar, o\'qituvchilar, guruhlar - hammasi bir joyda.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Real-time Statistikalar',
    description: 'Davomat, baholar, to\'lovlar - barchasi real vaqtda.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Shield,
    title: 'Xavfsizlik',
    description: 'Faqat admin tomonidan berilgan kirish. Maksimal xavfsizlik.',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
  {
    icon: Zap,
    title: 'Tezkor Ishlash',
    description: 'Zamonaviy texnologiyalar. Tez va samarali.',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
  {
    icon: BarChart3,
    title: 'KPI Dashboard',
    description: 'Qarorlar uchun real ma\'lumotlar va hisobotlar.',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
  },
]

export function PlatformOverview() {
  return (
    <section className="py-24 bg-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            RASH — Bu Nima?
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            ❌ Oddiy sayt emas • ❌ Oddiy CRM emas • ❌ Oddiy jurnal emas
            <br />
            <span className="text-green-400 font-semibold">
              ✅ Professional o'quv markazi boshqaruv platformasi
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`${feature.bgColor} backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-300 hover:scale-105`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 ${feature.bgColor} ${feature.color} rounded-lg mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
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
