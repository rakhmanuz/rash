import { GraduationCap, UserCog, Crown, CheckCircle2 } from 'lucide-react'

const roles = [
  {
    icon: GraduationCap,
    title: 'O\'quvchi Paneli',
    role: 'STUDENT',
    features: [
      'Davomat statistikasi (grafiklar)',
      'O\'zlashtirish darajasi',
      'Hozirgi bilim darajasi (level system)',
      'Topshiriqlar va test natijalari',
      'To\'lovlar holati',
      'Real-time rivojlanish ko\'rsatkichlari',
    ],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: UserCog,
    title: 'O\'qituvchi Paneli',
    role: 'TEACHER',
    features: [
      'Biriktirilgan guruhlar ro\'yxati',
      'Har bir o\'quvchi bo\'yicha ball kiritish',
      'O\'zlashtirish monitoringi',
      'Oylik maosh avtomatik hisoblanadi',
      'Bonus tizimi (natijaga bog\'langan)',
      'Statistik ko\'rsatkichlar',
    ],
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Crown,
    title: 'Menejer / Admin Paneli',
    role: 'ADMIN',
    features: [
      'Barcha o\'quvchilar ro\'yxati',
      'Guruhlar boshqaruvi',
      'O\'qituvchilar nazorati',
      'To\'lovlar: kirim / chiqim / qarzdorlik',
      'Umumiy moliyaviy hisobot',
      'O\'rtacha o\'zlashtirish darajalari',
      'Statistik dashboard (charts, KPI)',
      'Qaror qabul qilish uchun real ma\'lumotlar',
    ],
    color: 'from-green-500 to-emerald-500',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-800 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Role-Based Access System
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Har bir rol uchun maxsus dashboard va funksiyalar
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {roles.map((role, index) => {
            const Icon = role.icon
            return (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-gray-600 transition-all duration-300 hover:scale-105"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${role.color} rounded-xl mb-6`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {role.title}
                </h3>
                <ul className="space-y-3">
                  {role.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
